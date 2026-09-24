import unittest
import sqlite3
from datetime import datetime
from unittest.mock import MagicMock, patch

from duplicate_monitor import extract_detail, normalize_text, similarity, title_similarity
from crawl import CrawlBlockedError, fetchPage, findBodyCandidates, getDetailSinceDate, parsePostDate


class DuplicateMonitorTest(unittest.TestCase):
    @patch('crawl.DETAIL_SINCE_DATE', '2026-09-01')
    def test_candidate_selection_ignores_ip_and_exact_body_but_keeps_author_window(self):
        # Run the actual predicates on relational fixtures, without a hash column.
        with sqlite3.connect(':memory:') as db:
            db.row_factory = sqlite3.Row
            db.execute('''CREATE TABLE crawl_review_source (
                id INTEGER, gallery_id TEXT, post_id INTEGER, title TEXT,
                body_text TEXT, author_id TEXT, nickname TEXT, ip_prefix TEXT, post_date TEXT
            )''')
            rows = [
                (1, 'whiskey', 1, 'review', 'original', None, 'writer', '1.1', '2026-09-10'),
                (2, 'islay', 2, 'review', 'edited body', None, 'writer', '2.2', '2026-09-10'),
                (3, 'islay', 3, 'review', 'another edit', None, 'writer', None, '2026-09-10'),
                (4, 'islay', 4, 'review', 'original', None, 'different', '1.1', '2026-09-10'),
                (5, 'islay', 5, 'review', 'original', None, 'writer', '1.1', '2026-08-01'),
                (6, 'whiskey', 6, 'review', 'original', None, 'writer', '1.1', '2026-09-10'),
                (7, 'islay', 7, 'review', 'edited body', 'account', 'renamed', '9.9', '2026-09-10'),
                (8, 'islay', 8, 'review', 'original', 'different-account', 'writer', '1.1', '2026-09-10'),
            ]
            db.executemany('INSERT INTO crawl_review_source VALUES (?,?,?,?,?,?,?,?,?)', rows)

            class Cursor:
                def execute(self, statement, parameters):
                    self.rows = db.execute(statement.replace('%s', '?'), parameters)

                def fetchall(self):
                    return self.rows.fetchall()

            detail = {'author_id': None, 'nickname': 'writer', 'ip_prefix': '1.1', 'body_text': 'original'}
            basis, candidates = findBodyCandidates(Cursor(), 'whiskey', 1, 'writer', detail)
            self.assertEqual('anonymous_hint', basis)
            self.assertEqual({2, 3}, {row['id'] for row in candidates})
            detail['author_id'] = 'account'
            basis, candidates = findBodyCandidates(Cursor(), 'whiskey', 1, 'writer', detail)
            self.assertEqual('gallog_id', basis)
            self.assertEqual({7}, {row['id'] for row in candidates})

    def test_extracts_unmasked_gallog_id_and_body(self):
        page = """
        <div class="gall_writer" data-nick="작성자">
          <a class="writer_nikcon" title="center04** : 갤로그로 이동합니다."
             onclick="window.open('//gallog.dcinside.com/center0457');"></a>
        </div>
        <div class="write_div">향 은 바닐라<br>맛은 사과</div>
        """
        detail = extract_detail(page)
        self.assertEqual("center0457", detail["author_id"])
        self.assertEqual("작성자", detail["nickname"])
        self.assertIn("맛은 사과", detail["body_text"])
        self.assertIsNone(detail["pum_source"])

    def test_extracts_pum_source_without_treating_script_as_body(self):
        page = r'''
        <div class="write_div">
          <script>
          (function(){
            var u="https:\/\/gall.dcinside.com\/ajax\/pum_ajax\/get_contents";
            var data={"ci_t":null,"_GALLTYPE_":"","id":"whiskey","no":1777164};
          })();
          </script>
        </div>
        '''
        detail = extract_detail(page)
        self.assertEqual("", detail["body_text"])
        self.assertEqual(
            {"gallery_id": "whiskey", "post_id": 1777164},
            detail["pum_source"],
        )

    def test_normalization_ignores_spacing(self):
        self.assertEqual(normalize_text("향 은\n바닐라"), normalize_text("향은 바닐라"))

    def test_added_introduction_remains_similar(self):
        score = similarity(
            "향은 바닐라. 맛은 사과와 후추. 피니시는 길다.",
            "옥수수갤에도 올립니다. 향은 바닐라. 맛은 사과와 후추. 피니시는 길다.",
        )
        self.assertGreater(score["ratio"], 70)
        self.assertGreater(score["partial_ratio"], 90)

    def test_title_similarity_is_broad_for_prefiltering(self):
        self.assertGreaterEqual(
            title_similarity("[리뷰] 아드벡 우거다일 시음기", "아드벡 우거다일 리뷰"), 45
        )
        self.assertLess(title_similarity("아드벡 우거다일 리뷰", "서울 맛집 방문기"), 45)

    def test_parses_dcinside_post_dates(self):
        self.assertEqual("2026-08-01", parsePostDate("26/08/01").isoformat())
        self.assertEqual("2026-08-01", parsePostDate("2026-08-01").isoformat())

    def test_default_detail_window_is_rolling(self):
        self.assertEqual(
            "2026-07-18",
            getDetailSinceDate(datetime(2026, 8, 17)).isoformat(),
        )

    @patch("crawl.time.sleep")
    def test_stops_immediately_on_rate_limit(self, _sleep):
        response = MagicMock(status_code=429, content=b"rate limited")
        session = MagicMock()
        session.get.return_value = response

        with self.assertRaises(CrawlBlockedError):
            fetchPage(session, "https://example.test/list", "list")
        self.assertEqual(1, session.get.call_count)

    @patch("crawl.time.sleep")
    def test_treats_empty_success_response_as_block(self, _sleep):
        response = MagicMock(status_code=200, content=b"")
        session = MagicMock()
        session.get.return_value = response

        with self.assertRaises(CrawlBlockedError):
            fetchPage(session, "https://example.test/detail", "detail")


if __name__ == "__main__":
    unittest.main()
