-- Deploy the crawler that no longer reads/writes body_hash before resuming jobs.
-- Body similarity remains the comparison rule; content hashes do not establish authorship.
-- Add replacement indexes before removing the superseded ones.
ALTER TABLE crawl_review_source
    ADD INDEX IF NOT EXISTS idx_crawl_author_date (author_id, post_date),
    ADD INDEX IF NOT EXISTS idx_crawl_nickname_date (nickname, post_date),
    DROP INDEX IF EXISTS idx_crawl_author,
    DROP INDEX IF EXISTS idx_crawl_anon,
    DROP INDEX IF EXISTS idx_crawl_anon_date,
    DROP INDEX IF EXISTS idx_crawl_storage,
    DROP INDEX IF EXISTS idx_crawl_body_hash,
    DROP COLUMN IF EXISTS body_hash;

-- Keep uq_crawl_source (gallery_id, post_id): stable post identity / UPSERT key.
-- Keep idx_crawl_post_id (post_id): API joins collate cs.gallery_id/db_category,
-- so they use the integer lookup, not the former idx_crawl_storage index.
