import hashlib
import html
import re
import unicodedata

from bs4 import BeautifulSoup
try:
    from rapidfuzz import fuzz
except ImportError:  # Allows observation to start before the crawler image is rebuilt.
    from difflib import SequenceMatcher

    class _FuzzFallback:
        @staticmethod
        def ratio(left, right):
            return SequenceMatcher(None, left, right, autojunk=False).ratio() * 100

        @staticmethod
        def partial_ratio(left, right):
            shorter, longer = sorted((left, right), key=len)
            if not shorter:
                return 0.0
            match = SequenceMatcher(None, shorter, longer, autojunk=False).find_longest_match()
            return match.size / len(shorter) * 100

    fuzz = _FuzzFallback()


def normalize_text(value):
    value = html.unescape(value or "")
    value = unicodedata.normalize("NFKC", value).lower()
    # Layout differences are irrelevant for copied-post detection. Keep
    # punctuation/numbers because ABV and tasting scores are meaningful.
    return re.sub(r"\s+", "", value).strip()


def content_hash(value):
    return hashlib.sha256(normalize_text(value).encode("utf-8")).hexdigest()


def extract_detail(page_html):
    soup = BeautifulSoup(page_html, "html.parser")
    writer = soup.select_one(".gall_writer")
    nickname = ""
    ip_prefix = None
    author_id = None

    if writer:
        nickname = (writer.get("data-nick") or writer.get_text(" ", strip=True)).strip()
        ip_prefix = writer.get("data-ip")
        gallog_link = writer.select_one("a[onclick*='gallog.dcinside.com']")
        if not gallog_link:
            gallog_link = soup.select_one("a.writer_nikcon[onclick*='gallog.dcinside.com']")
        onclick = gallog_link.get("onclick", "") if gallog_link else ""
        match = re.search(r"gallog\.dcinside\.com/([^'\"/)]+)", onclick)
        if match:
            author_id = match.group(1)
        elif writer.get("data-uid"):
            author_id = writer.get("data-uid")

    body = soup.select_one(".write_div") or soup.select_one(".writing_view_box")
    body_text = body.get_text("\n", strip=True) if body else ""
    image_urls = []
    if body:
        for image in body.select("img[src]"):
            src = image.get("src")
            if src and src not in image_urls:
                image_urls.append(src)

    return {
        "nickname": nickname,
        "author_id": author_id,
        "ip_prefix": ip_prefix,
        "body_text": body_text,
        "body_hash": content_hash(body_text),
        "image_urls": "\n".join(image_urls),
    }


def similarity(left, right):
    a = normalize_text(left)
    b = normalize_text(right)
    if not a or not b:
        return {"ratio": 0.0, "partial_ratio": 0.0, "length_ratio": 0.0, "score": 0.0}
    ratio = float(fuzz.ratio(a, b))
    partial = float(fuzz.partial_ratio(a, b))
    length_ratio = min(len(a), len(b)) / max(len(a), len(b))
    # partial_ratio alone overvalues a short common fragment. Requiring a
    # meaningful length ratio makes added introductions possible but safe.
    containment = partial * length_ratio
    return {
        "ratio": ratio,
        "partial_ratio": partial,
        "length_ratio": length_ratio,
        "score": max(ratio, containment),
    }


def same_images(left, right):
    a = {url for url in (left or "").splitlines() if url}
    b = {url for url in (right or "").splitlines() if url}
    return bool(a and b and a == b)
