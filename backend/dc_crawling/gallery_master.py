"""Crawling targets and their review tabs.

db_category is kept compatible with the current other_review API.  A gallery may
have multiple review tabs, so tab_key is the stable identifier for a crawl job.
"""

GALLERY_MASTER = (
    {"name": "위스키", "gall_id": "whiskey", "tab_key": "whiskey-review", "tab_label": "리뷰", "db_category": "whiskey", "storage": "liquor_review"},
    {"name": "위스키", "gall_id": "whiskey", "tab_key": "whiskey-other", "tab_label": "기타리뷰", "db_category": "other"},
    {"name": "위스키", "gall_id": "whiskey", "tab_key": "whiskey-distillery-tour", "tab_label": "증류소투어", "db_category": "distillery-tour"},
    {"name": "브랜디", "gall_id": "brandy", "tab_key": "brandy-review", "tab_label": "리뷰", "db_category": "brandy"},
    {"name": "크래프트맥주", "gall_id": "beer", "tab_key": "beer-review", "tab_label": "리뷰", "db_category": "beer"},
    {"name": "칵테일", "gall_id": "cock_tail", "tab_key": "cock-tail-review", "tab_label": "리뷰", "db_category": "cock_tail"},
    {"name": "럼", "gall_id": "rum", "tab_key": "rum-review", "tab_label": "리뷰", "db_category": "rum"},
    {"name": "세계주류", "gall_id": "nuncestbibendum", "tab_key": "world-liquor-review", "tab_label": "술리뷰🍸", "db_category": "nuncestbibendum"},
    {"name": "주라섬", "gall_id": "isleofjura", "tab_key": "isleofjura-review", "tab_label": "리뷰📝", "db_category": "isleofjura", "storage": "liquor_review"},
    {"name": "캠벨타운", "gall_id": "campbeltown", "tab_key": "campbeltown-review", "tab_label": "∩^ω^∩", "db_category": "campbeltown", "storage": "liquor_review"},
    {"name": "아일라", "gall_id": "islay", "tab_key": "islay-review", "tab_label": "리뷰📝", "db_category": "islay", "storage": "liquor_review"},
    {"name": "옥수수물", "gall_id": "oaksusu", "tab_key": "oaksusu-review", "tab_label": "리뷰🌽", "db_category": "oaksusu", "storage": "liquor_review"},
    {"name": "옥수수물", "gall_id": "oaksusu", "tab_key": "oaksusu-other", "tab_label": "기타리뷰🎸", "db_category": "oaksusu-other"},
)
