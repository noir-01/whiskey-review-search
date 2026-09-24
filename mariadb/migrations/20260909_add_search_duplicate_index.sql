CREATE TABLE IF NOT EXISTS review_search_duplicate (
    review_id BIGINT NOT NULL,
    group_key CHAR(32) NOT NULL,
    is_representative TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    KEY idx_review_search_duplicate_group (group_key, review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE review_search_duplicate
    ADD COLUMN IF NOT EXISTS is_representative TINYINT(1) NOT NULL DEFAULT 0 AFTER group_key;

DELETE FROM review_search_duplicate;

INSERT INTO review_search_duplicate (review_id, group_key, is_representative)
SELECT eligible.review_id, eligible.group_key,
       ROW_NUMBER() OVER (
           PARTITION BY eligible.group_key
           ORDER BY eligible.representative_priority, eligible.review_id
       ) = 1
FROM (
    SELECT
        r.id AS review_id,
        CASE WHEN r.gallery_id = 'whiskey' THEN 0 ELSE 1 END AS representative_priority,
        MD5(CONCAT(
            LOWER(CASE
                WHEN LOCATE(')', TRIM(r.title)) BETWEEN 1 AND 20
                    THEN TRIM(SUBSTRING(TRIM(r.title), LOCATE(')', TRIM(r.title)) + 1))
                ELSE TRIM(r.title)
            END),
            '|', r.nickname, '|', r.post_date
        )) AS group_key
    FROM liquor_review r
    WHERE r.title IS NOT NULL
      AND TRIM(r.title) <> ''
      AND r.nickname IS NOT NULL
      AND r.post_date IS NOT NULL
) eligible
JOIN (
    SELECT candidate.group_key
    FROM (
        SELECT MD5(CONCAT(
            LOWER(CASE
                WHEN LOCATE(')', TRIM(r.title)) BETWEEN 1 AND 20
                    THEN TRIM(SUBSTRING(TRIM(r.title), LOCATE(')', TRIM(r.title)) + 1))
                ELSE TRIM(r.title)
            END),
            '|', r.nickname, '|', r.post_date
        )) AS group_key
        FROM liquor_review r
        WHERE r.title IS NOT NULL
          AND TRIM(r.title) <> ''
          AND r.nickname IS NOT NULL
          AND r.post_date IS NOT NULL
    ) candidate
    GROUP BY candidate.group_key
    HAVING COUNT(*) > 1
) duplicates ON duplicates.group_key = eligible.group_key;
