-- Search joins preserve utf8mb4_general_ci comparison semantics across tables.
-- COLLATE on crawl_review_source's string column prevents lookup through the
-- existing (gallery_id, post_id) / (db_category, post_id) indexes. Lead with the
-- integer equality instead; retain the string predicate to disambiguate galleries.
ALTER TABLE crawl_review_source
    ADD INDEX IF NOT EXISTS idx_crawl_post_id (post_id);
