CREATE TABLE IF NOT EXISTS liquor_review (
    row_id BIGINT NOT NULL AUTO_INCREMENT,
    gallery_id VARCHAR(64) NOT NULL,
    post_id INT NOT NULL,
    tab_key VARCHAR(64) NOT NULL,
    title VARCHAR(255),
    recom INT,
    reply INT,
    post_date DATE,
    nickname VARCHAR(255),
    PRIMARY KEY (row_id),
    UNIQUE KEY uq_liquor_review_source (gallery_id, post_id),
    KEY idx_liquor_review_post_date (post_date),
    FULLTEXT KEY ft_liquor_review_title (title)
) ENGINE=Mroonga DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO liquor_review
    (gallery_id, post_id, tab_key, title, recom, reply, post_date, nickname)
SELECT
    'whiskey', id, 'whiskey-review', title, recom, reply, post_date, nickname
FROM whiskey_review
ON DUPLICATE KEY UPDATE
    tab_key = VALUES(tab_key),
    title = VALUES(title),
    recom = VALUES(recom),
    reply = VALUES(reply),
    post_date = VALUES(post_date),
    nickname = VALUES(nickname);

INSERT INTO liquor_review
    (gallery_id, post_id, tab_key, title, recom, reply, post_date, nickname)
SELECT
    category,
    id,
    CASE category
        WHEN 'isleofjura' THEN 'isleofjura-review'
        WHEN 'campbeltown' THEN 'campbeltown-review'
        WHEN 'islay' THEN 'islay-review'
        WHEN 'oaksusu' THEN 'oaksusu-review'
    END,
    title,
    recom,
    reply,
    post_date,
    nickname
FROM other_review
WHERE category IN ('isleofjura', 'campbeltown', 'islay', 'oaksusu')
ON DUPLICATE KEY UPDATE
    tab_key = VALUES(tab_key),
    title = VALUES(title),
    recom = VALUES(recom),
    reply = VALUES(reply),
    post_date = VALUES(post_date),
    nickname = VALUES(nickname);
