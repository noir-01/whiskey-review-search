# -*- coding: utf-8 -*-
import requests
from urllib import request
from bs4 import BeautifulSoup
from datetime import datetime,timedelta
import time
import random
import pymysql
import re
import os
import sys

import logging
from logging.handlers import RotatingFileHandler

LOG_DIR = os.getenv('CRAWL_LOG_DIR', os.path.join(os.path.dirname(__file__), 'logs'))
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, 'crawler.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s:%(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        RotatingFileHandler(
            LOG_FILE,
            maxBytes=5 * 1024 * 1024,
            backupCount=3,
            encoding='utf-8',
        ),
    ],
)

#email
import smtplib
from email.mime.text import MIMEText

#selenium (searchHead 가져오기) 
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

from gallery_master import GALLERY_MASTER
from duplicate_monitor import extract_detail, similarity, title_similarity


class CrawlBlockedError(RuntimeError):
    """Raised when DCInside appears to be rate-limiting or blocking this client."""


LIST_DELAY_MIN = float(os.getenv('CRAWL_LIST_DELAY_MIN', '1'))
LIST_DELAY_MAX = float(os.getenv('CRAWL_LIST_DELAY_MAX', '2'))
DETAIL_DELAY_MIN = float(os.getenv('CRAWL_DETAIL_DELAY_MIN', '0.8'))
DETAIL_DELAY_MAX = float(os.getenv('CRAWL_DETAIL_DELAY_MAX', '1.5'))
JOB_DELAY_MIN = float(os.getenv('CRAWL_JOB_DELAY_MIN', '3'))
JOB_DELAY_MAX = float(os.getenv('CRAWL_JOB_DELAY_MAX', '7'))
MAX_DETAIL_REQUESTS = int(os.getenv('CRAWL_MAX_DETAIL_REQUESTS', '2000'))
DETAIL_LOOKBACK_DAYS = int(os.getenv('CRAWL_DETAIL_LOOKBACK_DAYS', '30'))
TITLE_SIMILARITY_THRESHOLD = float(os.getenv('CRAWL_TITLE_SIMILARITY_THRESHOLD', '45'))
MAX_TITLE_CANDIDATES = int(os.getenv('CRAWL_MAX_TITLE_CANDIDATES', '5'))
AUTO_CONFIRM_SIMILARITY_THRESHOLD = float(
    os.getenv('CRAWL_AUTO_CONFIRM_SIMILARITY_THRESHOLD', '95')
)


def getDetailSinceDate(now=None):
    configured = os.getenv('CRAWL_DETAIL_SINCE', '').strip()
    if configured:
        return datetime.strptime(configured, '%Y-%m-%d').date()
    current = (now or datetime.now()).date()
    return current - timedelta(days=DETAIL_LOOKBACK_DAYS)


DETAIL_SINCE_DATE = getDetailSinceDate()


def parsePostDate(value):
    date_format = '%y/%m/%d' if '/' in value else '%Y-%m-%d'
    return datetime.strptime(value, date_format).date()


def parsePublishedAt(date_tag):
    """Return DCInside's second-precision timestamp when it is available."""
    title = (date_tag.get('title') or '').strip()
    if title:
        for date_format in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M'):
            try:
                return datetime.strptime(title, date_format)
            except ValueError:
                pass
    value = date_tag.get_text(strip=True)
    try:
        return datetime.combine(parsePostDate(value), datetime.min.time())
    except ValueError:
        return None


def fetchPage(session, url, request_kind):
    if request_kind == 'list':
        delay_min, delay_max = LIST_DELAY_MIN, LIST_DELAY_MAX
    else:
        delay_min, delay_max = DETAIL_DELAY_MIN, DETAIL_DELAY_MAX

    for attempt in range(3):
        time.sleep(random.uniform(delay_min, delay_max))
        try:
            response = session.get(url, timeout=20)
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep((2 ** attempt) * 5 + random.uniform(0, 2))
            continue

        if response.status_code in (403, 429):
            raise CrawlBlockedError(
                f"DCInside blocked the {request_kind} request: HTTP {response.status_code} ({url})"
            )
        if response.status_code >= 500:
            if attempt == 2:
                response.raise_for_status()
            time.sleep((2 ** attempt) * 5 + random.uniform(0, 2))
            continue

        response.raise_for_status()
        if not response.content.strip():
            raise CrawlBlockedError(
                f"DCInside returned an empty body for the {request_kind} request ({url})"
            )
        logging.info("%s request succeeded: HTTP %s %s", request_kind, response.status_code, url)
        return response

    raise RuntimeError(f"Request retries exhausted: {url}")

def getTotalPage(url):
    options = Options()
    options.add_argument("--headless")
    driver = webdriver.Remote(
        command_executor='http://selenium-chrome:4444/wd/hub',
        options=options
    )
    try:
        driver.get(url)
        # 페이지 로딩을 위한 충분한 시간 제공
        time.sleep(2)
        
        # 요소 찾기
        wait = WebDriverWait(driver, 10)
        total_page_element = wait.until(
            EC.presence_of_element_located((By.XPATH, "//span[@class='num total_page']"))
        )
        
        # 디버깅: 요소의 HTML 확인
        html_content = total_page_element.get_attribute('outerHTML')
        value = total_page_element.get_attribute('textContent')
        return int(value) if value else None
    except Exception as e:
        print(f"오류 발생: {e}")
        return None
    finally:
        driver.quit()
    
    try:
        import shutil
        shutil.rmtree(user_data_dir, ignore_errors=True)
    except:
        pass
#liquor: 실제 갤러리 ID
def validateSearchHead(liquor, tab_label):
    """
    Validates if the search_head value exists and contains the expected subject string
    Returns the valid search_head or raises RuntimeError if validation fails
    """

    expected_text = tab_label

    # Fetch the navigation menu
    try:
        options = Options()
        options.add_argument("--headless")
        options.page_load_strategy = "eager"
        driver = webdriver.Remote(
            command_executor='http://selenium-chrome:4444/wd/hub',
            options=options
        )

        url = f"https://gall.dcinside.com/mgallery/board/lists/?id={liquor}"  # Replace with your actual base URL
        driver.set_page_load_timeout(20)
        driver.get(url)
        time.sleep(3)
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")

        for a in soup.select("ul li a"):
            onclick = a.get("onclick", "")
            if "listSearchHead(" in onclick:
                head_id = onclick.split("listSearchHead(")[-1].split(")")[0]
                label = a.text.strip()
                if label ==expected_text:
                    driver.quit()
                    return int(head_id)

        raise RuntimeError(f"{liquor}갤 '{expected_text}' 없음")

    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Error validating search_head: {str(e)}") from e

def sendErrorEmail(error_message):
    sender = os.getenv('GMAIL_EMAIL')
    recipient = os.getenv('GMAIL_EMAIL')
    subject = "크롤링 실패"
    
    msg = MIMEText(error_message)
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = recipient
    
    try:
        smtp_server = smtplib.SMTP('smtp.gmail.com', 587) 
        smtp_server.starttls()
        smtp_server.login(os.getenv('GMAIL_EMAIL'), os.getenv('GMAIL_PW'))
        smtp_server.send_message(msg)
        smtp_server.quit()
        print(f"Error email sent: {error_message}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")


def sendReportEmail(subject, report):
    sender = os.getenv('GMAIL_EMAIL')
    if not sender or not os.getenv('GMAIL_PW'):
        logging.info("메일 설정이 없어 보고서를 로그로만 출력합니다.\n%s", report)
        return
    msg = MIMEText(report, _charset='utf-8')
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = sender
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp_server:
            smtp_server.starttls()
            smtp_server.login(sender, os.getenv('GMAIL_PW'))
            smtp_server.send_message(msg)
    except Exception as e:
        logging.error("일일 보고 메일 전송 실패: %s", e)


def getConnection(dict_cursor=False):
    return pymysql.connect(
        host=os.getenv('DB_HOST'),
        port=int(os.getenv('DB_PORT', '3306')),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        db=os.getenv('DB_NAME'),
        charset='utf8mb4',
        use_unicode=True,
        cursorclass=pymysql.cursors.DictCursor if dict_cursor else pymysql.cursors.Cursor,
    )


def ensureMonitorTables():
    statements = (
        """CREATE TABLE IF NOT EXISTS crawl_review_source (
            id BIGINT NOT NULL AUTO_INCREMENT,
            gallery_id VARCHAR(64) NOT NULL,
            post_id INT NOT NULL,
            tab_key VARCHAR(64) NOT NULL,
            db_category VARCHAR(64) NOT NULL,
            title VARCHAR(500) NOT NULL,
            nickname VARCHAR(255),
            author_id VARCHAR(255),
            ip_prefix VARCHAR(64),
            body_text LONGTEXT,
            post_date DATE,
            published_at DATETIME,
            crawled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_crawl_source (gallery_id, post_id),
            KEY idx_crawl_author_date (author_id, post_date),
            KEY idx_crawl_nickname_date (nickname, post_date),
            KEY idx_crawl_post_id (post_id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
        """CREATE TABLE IF NOT EXISTS crawl_duplicate_candidate (
            id BIGINT NOT NULL AUTO_INCREMENT,
            source_id BIGINT NOT NULL,
            candidate_source_id BIGINT NOT NULL,
            author_basis VARCHAR(32) NOT NULL,
            similarity_score DECIMAL(5,2) NOT NULL,
            ratio_score DECIMAL(5,2) NOT NULL,
            partial_score DECIMAL(5,2) NOT NULL,
            length_ratio DECIMAL(6,5) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'observed',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_candidate_pair (source_id, candidate_source_id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
        """CREATE TABLE IF NOT EXISTS review_duplicate_group (
            id BIGINT NOT NULL AUTO_INCREMENT,
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            merged_into_group_id BIGINT,
            confidence_score DECIMAL(5,2) NOT NULL,
            rule_version VARCHAR(32) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_duplicate_group_status (status)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
        """CREATE TABLE IF NOT EXISTS review_duplicate_member (
            source_id BIGINT NOT NULL,
            group_id BIGINT NOT NULL,
            confidence_score DECIMAL(5,2) NOT NULL,
            assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (source_id),
            KEY idx_duplicate_member_group (group_id, source_id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
        """CREATE TABLE IF NOT EXISTS review_duplicate_history (
            id BIGINT NOT NULL AUTO_INCREMENT,
            source_id BIGINT NOT NULL,
            previous_group_id BIGINT,
            new_group_id BIGINT,
            action VARCHAR(32) NOT NULL,
            confidence_score DECIMAL(5,2) NOT NULL,
            rule_version VARCHAR(32) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_duplicate_history_source (source_id, created_at)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci""",
    )
    with getConnection(dict_cursor=True) as conn:
        with conn.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
            cursor.execute(
                "ALTER TABLE crawl_review_source ADD COLUMN IF NOT EXISTS published_at DATETIME NULL AFTER post_date"
            )
            cursor.execute(
                "ALTER TABLE crawl_review_source ADD INDEX IF NOT EXISTS idx_crawl_post_id (post_id)"
            )
            # Equality columns precede the date range used to shortlist candidates.
            # Keep post_id/source keys for review and source-identity joins.
            cursor.execute(
                "ALTER TABLE crawl_review_source "
                "ADD INDEX IF NOT EXISTS idx_crawl_author_date (author_id,post_date), "
                "ADD INDEX IF NOT EXISTS idx_crawl_nickname_date (nickname,post_date), "
                "DROP INDEX IF EXISTS idx_crawl_author, "
                "DROP INDEX IF EXISTS idx_crawl_anon, "
                "DROP INDEX IF EXISTS idx_crawl_anon_date, "
                "DROP INDEX IF EXISTS idx_crawl_storage, "
                "DROP INDEX IF EXISTS idx_crawl_body_hash, "
                "DROP COLUMN IF EXISTS body_hash"
            )
        conn.commit()


def findTitleCandidates(job, post_id, title, nickname, post_date, published_at):
    """Persist list metadata and shortlist without requesting a detail page."""
    with getConnection(dict_cursor=True) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO crawl_review_source
                   (gallery_id,post_id,tab_key,db_category,title,nickname,post_date,published_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                   ON DUPLICATE KEY UPDATE title=VALUES(title), nickname=VALUES(nickname),
                                           post_date=VALUES(post_date),
                                           published_at=COALESCE(VALUES(published_at),published_at)""",
                (job['gall_id'], post_id, job['tab_key'], job['db_category'],
                 title, nickname, post_date, published_at),
            )
            cursor.execute(
                """SELECT id,gallery_id,post_id,title,nickname,body_text
                   FROM crawl_review_source
                   WHERE nickname=%s AND gallery_id<>%s AND post_date >= %s""",
                (nickname, job['gall_id'], DETAIL_SINCE_DATE),
            )
            rows = cursor.fetchall()
        conn.commit()
    matches = [
        row for row in rows
        if title_similarity(title, row['title']) >= TITLE_SIMILARITY_THRESHOLD
    ]
    return matches[:MAX_TITLE_CANDIDATES]


def hydrateTitleCandidates(title_candidates, session, report):
    """Fetch an older candidate only after its writer/title passed the list-page filter."""
    for candidate in title_candidates:
        if candidate['body_text']:
            continue
        if report['detail_requests'] >= MAX_DETAIL_REQUESTS:
            report['detail_limit_reached'] = True
            return
        url = ("https://gall.dcinside.com/mgallery/board/view/"
               f"?id={candidate['gallery_id']}&no={candidate['post_id']}")
        report['detail_requests'] += 1
        response = fetchPage(session, url, 'detail')
        detail = extract_detail(response.text)
        if not detail['body_text']:
            if detail['pum_source']:
                logging.info(
                    "퍼온 글 후보의 빈 본문을 차단으로 판단하지 않습니다: %s -> %s/%s",
                    url, detail['pum_source']['gallery_id'], detail['pum_source']['post_id'],
                )
                continue
            raise CrawlBlockedError(f"DCInside detail body was not found ({url})")
        with getConnection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """UPDATE crawl_review_source
                       SET nickname=%s,author_id=%s,ip_prefix=%s,body_text=%s,
                           crawled_at=CURRENT_TIMESTAMP
                       WHERE id=%s""",
                    (detail['nickname'] or candidate['nickname'], detail['author_id'],
                     detail['ip_prefix'], detail['body_text'],
                     candidate['id']),
                )
            conn.commit()


def assignDuplicateGroup(cursor, left_source_id, right_source_id, confidence):
    """Assign two confidently matching sources to one group and retain merge history."""
    cursor.execute(
        """SELECT source_id,group_id FROM review_duplicate_member
           WHERE source_id IN (%s,%s)""",
        (left_source_id, right_source_id),
    )
    memberships = {row['source_id']: row['group_id'] for row in cursor.fetchall()}
    group_ids = sorted(set(memberships.values()))

    if not group_ids:
        cursor.execute(
            """INSERT INTO review_duplicate_group
               (confidence_score,rule_version) VALUES (%s,'text-v1')""",
            (confidence,),
        )
        target_group_id = cursor.lastrowid
    else:
        target_group_id = group_ids[0]

    if len(group_ids) > 1:
        for merged_group_id in group_ids[1:]:
            cursor.execute(
                """SELECT source_id FROM review_duplicate_member WHERE group_id=%s""",
                (merged_group_id,),
            )
            moved_source_ids = [row['source_id'] for row in cursor.fetchall()]
            cursor.execute(
                """UPDATE review_duplicate_member SET group_id=%s,
                       confidence_score=GREATEST(confidence_score,%s)
                   WHERE group_id=%s""",
                (target_group_id, confidence, merged_group_id),
            )
            for moved_source_id in moved_source_ids:
                cursor.execute(
                    """INSERT INTO review_duplicate_history
                       (source_id,previous_group_id,new_group_id,action,confidence_score,rule_version)
                       VALUES (%s,%s,%s,'merge',%s,'text-v1')""",
                    (moved_source_id, merged_group_id, target_group_id, confidence),
                )
            cursor.execute(
                """UPDATE review_duplicate_group SET status='merged',merged_into_group_id=%s
                   WHERE id=%s""",
                (target_group_id, merged_group_id),
            )

    for source_id in (left_source_id, right_source_id):
        if source_id in memberships:
            continue
        cursor.execute(
            """INSERT INTO review_duplicate_member
               (source_id,group_id,confidence_score) VALUES (%s,%s,%s)""",
            (source_id, target_group_id, confidence),
        )
        cursor.execute(
            """INSERT INTO review_duplicate_history
               (source_id,new_group_id,action,confidence_score,rule_version)
               VALUES (%s,%s,'assign',%s,'text-v1')""",
            (source_id, target_group_id, confidence),
        )


def backfillConfirmedDuplicateGroups():
    """Promote existing high-confidence candidates without discarding candidate history."""
    with getConnection(dict_cursor=True) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT source_id,candidate_source_id,similarity_score
                   FROM crawl_duplicate_candidate
                   WHERE similarity_score >= %s""",
                (AUTO_CONFIRM_SIMILARITY_THRESHOLD,),
            )
            for candidate in cursor.fetchall():
                assignDuplicateGroup(
                    cursor, candidate['source_id'], candidate['candidate_source_id'],
                    candidate['similarity_score'],
                )
                cursor.execute(
                    """UPDATE crawl_duplicate_candidate SET status='auto_confirmed'
                       WHERE source_id=%s AND candidate_source_id=%s""",
                    (candidate['source_id'], candidate['candidate_source_id']),
                )
        conn.commit()


def findBodyCandidates(cursor, gallery_id, source_id, nickname, detail):
    """Shortlist by author hints and date; neither IP nor exact text is identity."""
    if detail['author_id']:
        cursor.execute(
            """SELECT id,gallery_id,post_id,title,body_text FROM crawl_review_source
               WHERE author_id=%s AND gallery_id<>%s AND id<>%s
                 AND post_date >= %s""",
            (detail['author_id'], gallery_id, source_id, DETAIL_SINCE_DATE),
        )
        return 'gallog_id', cursor.fetchall()
    cursor.execute(
        """SELECT id,gallery_id,post_id,title,body_text FROM crawl_review_source
           WHERE author_id IS NULL AND gallery_id<>%s AND id<>%s
             AND post_date >= %s AND nickname=%s""",
        (gallery_id, source_id, DETAIL_SINCE_DATE, detail['nickname'] or nickname),
    )
    return 'anonymous_hint', cursor.fetchall()


def collectAndCompareSource(job, post_id, title, nickname, post_date, session, report,
                            title_candidates):
    if not title_candidates:
        return None

    with getConnection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT body_text FROM crawl_review_source WHERE gallery_id=%s AND post_id=%s",
                (job['gall_id'], post_id),
            )
            existing = cursor.fetchone()
    if existing and existing[0]:
        return None

    if report['detail_requests'] >= MAX_DETAIL_REQUESTS:
        report['detail_limit_reached'] = True
        return None

    url = f"https://gall.dcinside.com/mgallery/board/view/?id={job['gall_id']}&no={post_id}"
    report['detail_requests'] += 1
    response = fetchPage(session, url, 'detail')
    detail = extract_detail(response.text)
    if not detail['body_text']:
        if detail['pum_source']:
            return confirmPumDuplicate(
                job, post_id, title, nickname, detail, url,
            )
        raise CrawlBlockedError(f"DCInside detail body was not found ({url})")

    hydrateTitleCandidates(title_candidates, session, report)

    with getConnection(dict_cursor=True) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """UPDATE crawl_review_source
                       SET nickname=%s,author_id=%s,ip_prefix=%s,body_text=%s,
                           crawled_at=CURRENT_TIMESTAMP
                   WHERE gallery_id=%s AND post_id=%s""",
                (detail['nickname'] or nickname, detail['author_id'], detail['ip_prefix'],
                 detail['body_text'],
                 job['gall_id'], post_id),
            )
            cursor.execute(
                "SELECT id FROM crawl_review_source WHERE gallery_id=%s AND post_id=%s",
                (job['gall_id'], post_id),
            )
            source_id = cursor.fetchone()['id']

            author_basis, candidates = findBodyCandidates(
                cursor, job['gall_id'], source_id, nickname, detail,
            )

            observed = []
            for candidate in candidates:
                scores = similarity(detail['body_text'], candidate['body_text'])
                if scores['score'] < 70:
                    continue
                left_id, right_id = sorted((source_id, candidate['id']))
                cursor.execute(
                    """INSERT INTO crawl_duplicate_candidate
                       (source_id,candidate_source_id,author_basis,similarity_score,
                        ratio_score,partial_score,length_ratio)
                       VALUES (%s,%s,%s,%s,%s,%s,%s)
                       ON DUPLICATE KEY UPDATE similarity_score=VALUES(similarity_score),
                           ratio_score=VALUES(ratio_score), partial_score=VALUES(partial_score),
                           length_ratio=VALUES(length_ratio)""",
                    (left_id, right_id, author_basis, scores['score'], scores['ratio'],
                     scores['partial_ratio'], scores['length_ratio']),
                )
                is_new_candidate = cursor.rowcount == 1
                if scores['score'] >= AUTO_CONFIRM_SIMILARITY_THRESHOLD:
                    assignDuplicateGroup(cursor, left_id, right_id, scores['score'])
                    cursor.execute(
                        """UPDATE crawl_duplicate_candidate SET status='auto_confirmed'
                           WHERE source_id=%s AND candidate_source_id=%s""",
                        (left_id, right_id),
                    )
                if is_new_candidate:
                    observed.append({
                        'score': scores['score'],
                        'author_basis': author_basis,
                        'new_title': title,
                        'new_url': url,
                        'old_title': candidate['title'],
                        'old_url': f"https://gall.dcinside.com/mgallery/board/view/?id={candidate['gallery_id']}&no={candidate['post_id']}",
                    })
        conn.commit()
    return observed


def confirmPumDuplicate(job, post_id, title, nickname, detail, url):
    """Confirm a DCInside '퍼오기' post against its explicitly referenced source."""
    pum_source = detail['pum_source']
    with getConnection(dict_cursor=True) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """UPDATE crawl_review_source
                       SET nickname=%s,author_id=%s,ip_prefix=%s,crawled_at=CURRENT_TIMESTAMP
                   WHERE gallery_id=%s AND post_id=%s""",
                (detail['nickname'] or nickname, detail['author_id'], detail['ip_prefix'],
                 job['gall_id'], post_id),
            )
            cursor.execute(
                "SELECT id FROM crawl_review_source WHERE gallery_id=%s AND post_id=%s",
                (job['gall_id'], post_id),
            )
            current_source = cursor.fetchone()
            cursor.execute(
                """SELECT id,title FROM crawl_review_source
                   WHERE gallery_id=%s AND post_id=%s""",
                (pum_source['gallery_id'], pum_source['post_id']),
            )
            original_source = cursor.fetchone()

            if not current_source or not original_source:
                logging.warning(
                    "퍼온 글 원문이 수집 테이블에 없어 중복 연결을 보류합니다: %s -> %s/%s",
                    url, pum_source['gallery_id'], pum_source['post_id'],
                )
                conn.commit()
                return []

            scores = similarity(title, original_source['title'])
            if scores['score'] < TITLE_SIMILARITY_THRESHOLD:
                logging.warning(
                    "퍼온 글의 제목 유사도가 낮아 중복 연결을 보류합니다: %.1f %s",
                    scores['score'], url,
                )
                conn.commit()
                return []

            left_id, right_id = sorted((current_source['id'], original_source['id']))
            cursor.execute(
                """INSERT INTO crawl_duplicate_candidate
                   (source_id,candidate_source_id,author_basis,similarity_score,
                    ratio_score,partial_score,length_ratio,status)
                   VALUES (%s,%s,'pum_repost',%s,%s,%s,%s,'auto_confirmed')
                   ON DUPLICATE KEY UPDATE author_basis='pum_repost',
                       similarity_score=VALUES(similarity_score),ratio_score=VALUES(ratio_score),
                       partial_score=VALUES(partial_score),length_ratio=VALUES(length_ratio),
                       status='auto_confirmed'""",
                (left_id, right_id, scores['score'], scores['ratio'],
                 scores['partial_ratio'], scores['length_ratio']),
            )
            is_new_candidate = cursor.rowcount == 1
            assignDuplicateGroup(cursor, left_id, right_id, scores['score'])
        conn.commit()

    if not is_new_candidate:
        return []
    return [{
        'score': scores['score'],
        'author_basis': 'pum_repost',
        'new_title': title,
        'new_url': url,
        'old_title': original_source['title'],
        'old_url': ("https://gall.dcinside.com/mgallery/board/view/"
                    f"?id={pum_source['gallery_id']}&no={pum_source['post_id']}"),
    }]


def crawlByPage(job, dataList, report, findLastPage=False):

    liquor = job['gall_id']
    category = job['db_category']

    search_head = validateSearchHead(liquor, job['tab_label'])
    
    
    # 헤더 설정
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    })
    
    #유동닉 정규식 ex) ㅇㅇ(223.38)
    fluidNick = re.compile(r'.+\(\d{1,3}[.]\d{1,3}\)')

    batch_size = 1024
    BASE_URL = f"https://gall.dcinside.com/mgallery/board/lists/?id={liquor}&sort_type=N&search_head={search_head}"
    
    #함수 전달값에 따라 10페이지 vs 최대 페이지
    page = 1
    if findLastPage:
        max_pages = getTotalPage(BASE_URL)
    else:
        if liquor=='whiskey' and category=='whiskey':
            max_pages = 10
        else:
            max_pages = 3

    while page <= max_pages:
        # html
        URL = BASE_URL + f"&page={page}"
        response = fetchPage(session, URL, 'list')
        soup = BeautifulSoup(response.content, 'html.parser')
        try:
            html_list = soup.find('tbody').find_all('tr')
        except:
            print("response: ",response, '\n', soup.find('tbody'))
            break

        for i in html_list:
            #말머리
            subject = i.find('td', class_='gall_subject').text
            if subject=="공지" or subject=="설문" or subject=="이슈" or subject=="AD":   #공지글일경우 skip
                continue

            # 제목
            title = i.find('a', href=True).text           

            #글번호
            try:
                id = int(i.find('td', class_='gall_num').text)
            except:
                print("ERROR TITLE: ",title,"\n==================")
                continue
        
            #닉네임
            nickname = i.find('td',class_="gall_writer ub-writer").text.strip()

            if fluidNick.match(nickname) is not None:   #유동이면 아이피 무시하고 ㅇㅇ으로 바꾸기.
                nickname = 'ㅇㅇ'

            # 날짜 추출
            date_tag = i.find('td', class_='gall_date')
            date_dict = date_tag.attrs

            if len(date_dict) == 2:
                postDate = date_dict['title'][:10]
                postTime = date_dict['title'][11:]

            else:
                postDate =  date_tag.text
            publishedAt = parsePublishedAt(date_tag)

            # 추천 수 추출
            recommend_tag = i.find('td', class_='gall_recommend')
            recom = recommend_tag.text

            # 댓글 수 추출
            try:
                reply_tag = i.span.string.text
                if reply_tag[0] =='[':
                    reply = reply_tag.replace('[','')
                    reply = reply.replace(']','')
                else:
                    reply = 0
                #작성자가 [blabla]일 경우 0으로 바꿈
                reply=int(reply)

            except:
                reply = 0
            postDate_datetime = parsePostDate(postDate)
            
            if job.get('storage') == 'liquor_review':
                dataList.append([
                    job['gall_id'], id, job['tab_key'], title.strip(), nickname,
                    recom, reply, postDate,
                ])
            else:
                dataList.append([category,id,title.strip(),nickname,recom,reply,postDate])

            if postDate_datetime >= DETAIL_SINCE_DATE and not report['detail_limit_reached']:
                try:
                    title_candidates = findTitleCandidates(
                        job, id, title.strip(), nickname, postDate, publishedAt
                    )
                    if not title_candidates:
                        report['detail_prefilter_skips'] += 1
                    observed = collectAndCompareSource(
                        job, id, title.strip(), nickname, postDate, session, report,
                        title_candidates,
                    )
                    if observed is not None:
                        report['new_sources'] += 1
                        report['candidates'].extend(observed)

                except CrawlBlockedError:
                    raise
                except Exception as e:
                    report['detail_errors'].append(f"{liquor}/{id}: {e}")
                    logging.exception("상세 글 수집 실패: %s/%s", liquor, id)
            
            if len(dataList)>=batch_size:
                print(id)
                sqlUpload(dataList,job)
                print(category,len(dataList),"upload completed")
                dataList.clear()

        page+=1
    
    #마지막에 남은 데이터 업로드
    sqlUpload(dataList,job)

def sqlUpload(dataList,job):
    if not dataList:
        return
    conn = getConnection()
    print("CONNECTION SET")

    cursor = conn.cursor()
    cursor.execute("SET NAMES utf8mb4")
    print("LETS UPLOAD")

    if job.get('storage') == 'liquor_review':
        sql = """INSERT INTO liquor_review
                 (gallery_id,post_id,tab_key,title,nickname,recom,reply,post_date)
                 VALUES(%s,%s,%s,%s,%s,%s,%s,%s)
                 ON DUPLICATE KEY UPDATE
                   tab_key=VALUES(tab_key), title=VALUES(title), nickname=VALUES(nickname),
                   recom=VALUES(recom), reply=VALUES(reply), post_date=VALUES(post_date)"""
        cursor.executemany(sql,dataList)
    else:
        sql = """INSERT INTO other_review
                 (category,id,title,nickname,recom,reply,post_date)
                 VALUES(%s,%s,%s,%s,%s,%s,%s)
                 ON DUPLICATE KEY UPDATE
                   title=VALUES(title), nickname=VALUES(nickname), recom=VALUES(recom),
                   reply=VALUES(reply), post_date=VALUES(post_date)"""
        cursor.executemany(sql,dataList)
    try:    
        conn.commit()
    except Exception as e:
        print("Commit failed:", e)
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    ensureMonitorTables()
    backfillConfirmedDuplicateGroups()
    report = {
        'new_sources': 0,
        'candidates': [],
        'detail_errors': [],
        'detail_requests': 0,
        'detail_prefilter_skips': 0,
        'detail_limit_reached': False,
    }
    logging.info(
        "상세 수집 기준일=%s, 실행당 최대 상세 요청=%s",
        DETAIL_SINCE_DATE,
        MAX_DETAIL_REQUESTS,
    )

    MAX_RETRIES = 3
    RETRY_DELAY = 300 #재시도=5분

    pending = list(GALLERY_MASTER)
    for attempt in range(1, MAX_RETRIES + 1):
        failed = []
        for job in pending:
            try:
                dataList = []
                logging.info("크롤링 작업 시작: %s", job['tab_key'])
                crawlByPage(job, dataList, report)
                time.sleep(random.uniform(JOB_DELAY_MIN, JOB_DELAY_MAX))
            except CrawlBlockedError as e:
                message = f"차단 신호를 감지해 전체 크롤링을 즉시 중단합니다: {e}"
                logging.critical(message)
                sendErrorEmail(message)
                sys.exit(2)
            except Exception as e:
                logging.error(f"[시도 {attempt}] {job['tab_key']} 실패: {e}")
                failed.append((job, str(e)))

        if not failed:
            lines = [
                f"신규 원문: {report['new_sources']}개",
                f"중복 후보: {len(report['candidates'])}개",
                f"상세 수집 오류: {len(report['detail_errors'])}개",
                f"상세 요청: {report['detail_requests']}개",
                f"상세 요청 상한 도달: {report['detail_limit_reached']}",
                "",
            ]
            for candidate in report['candidates']:
                lines.extend([
                    f"[{candidate['score']:.1f}] {candidate['author_basis']}",
                    f"- {candidate['new_title']}\n  {candidate['new_url']}",
                    f"- {candidate['old_title']}\n  {candidate['old_url']}",
                    "",
                ])
            if report['detail_errors']:
                lines.append("상세 수집 오류")
                lines.extend(f"- {error}" for error in report['detail_errors'])
            sendReportEmail(
                f"[크롤링 관찰 보고] {datetime.now().strftime('%Y-%m-%d')}",
                "\n".join(lines),
            )
            sys.exit(0)

        failed_names = [job['tab_key'] for job, _ in failed]
        failed_detail = "\n".join(f"  - {job['tab_key']}: {e}" for job, e in failed)
        if attempt < MAX_RETRIES:
            sendErrorEmail(
                f"[시도 {attempt}/{MAX_RETRIES}] 실패 카테고리: {failed_names}\n\n{failed_detail}\n\n"
                f"{RETRY_DELAY // 60}분 후 재시도합니다."
            )
            logging.warning(f"[시도 {attempt}] 실패: {failed_names}, {RETRY_DELAY}초 후 재시도")
            time.sleep(RETRY_DELAY)
            pending = [job for job, _ in failed]
        else:
            sendErrorEmail(
                f"[최종 실패] {MAX_RETRIES}회 시도 후 포기\n\n실패 카테고리: {failed_names}\n\n{failed_detail}"
            )
            logging.error(f"[최종 실패] {MAX_RETRIES}회 시도 후 포기: {failed_names}")
            sys.exit(1)
