package com.whiskeygallery_review.review_api.repository.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.whiskeygallery_review.review_api.entity.LiquorReview;
import com.whiskeygallery_review.review_api.entity.QLiquorReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewCustomRepository;
import jakarta.persistence.EntityManager;

public class LiquorReviewRepositoryImpl extends BaseReviewCustomRepositoryImpl<LiquorReview>
        implements BaseReviewCustomRepository<LiquorReview> {

    public LiquorReviewRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager) {
        // cs uses a different collation: idx_crawl_post_id supplies the indexed
        // lookup while COLLATE preserves the existing gallery comparison rules.
        // For peer_r, collate the value from peer_cs so peer_r's unique key remains usable.
        super(
                queryFactory,
                entityManager,
                QLiquorReview.liquorReview,
                QLiquorReview.liquorReview.title,
                QLiquorReview.liquorReview.nickname,
                QLiquorReview.liquorReview.galleryId,
                "gallery_id",
                "id,gallery_id,post_id,tab_key,title,recom,reply,post_date,nickname",
                "LEFT JOIN crawl_review_source cs ON cs.gallery_id COLLATE utf8mb4_general_ci=r.gallery_id AND cs.post_id=r.post_id "
                        + "LEFT JOIN review_search_duplicate sd ON sd.review_id=r.id",
                "COALESCE(CONCAT('legacy:',sd.group_key),CONCAT('id:',r.id))",
                "CASE WHEN r.gallery_id='whiskey' THEN 0 ELSE 1 END",
                // Confirmed groups choose their own representative; the title-only
                // fallback must not veto that choice and hide the whole group.
                "(dm.group_id IS NOT NULL OR sd.review_id IS NULL OR sd.is_representative=1) AND "
                        + "(dm.group_id IS NULL OR NOT EXISTS ("
                        + "SELECT 1 FROM review_duplicate_member peer_dm "
                        + "JOIN crawl_review_source peer_cs ON peer_cs.id=peer_dm.source_id "
                        + "JOIN liquor_review peer_r ON peer_r.gallery_id=peer_cs.gallery_id COLLATE utf8mb4_general_ci "
                        + "AND peer_r.post_id=peer_cs.post_id "
                        + "WHERE peer_dm.group_id=dm.group_id AND ("
                        + "COALESCE(peer_cs.published_at,TIMESTAMP(peer_r.post_date))<COALESCE(cs.published_at,TIMESTAMP(r.post_date)) "
                        + "OR (COALESCE(peer_cs.published_at,TIMESTAMP(peer_r.post_date))=COALESCE(cs.published_at,TIMESTAMP(r.post_date)) "
                        + "AND CASE WHEN peer_r.gallery_id='whiskey' THEN 0 ELSE 1 END<CASE WHEN r.gallery_id='whiskey' THEN 0 ELSE 1 END) "
                        + "OR (COALESCE(peer_cs.published_at,TIMESTAMP(peer_r.post_date))=COALESCE(cs.published_at,TIMESTAMP(r.post_date)) "
                        + "AND CASE WHEN peer_r.gallery_id='whiskey' THEN 0 ELSE 1 END=CASE WHEN r.gallery_id='whiskey' THEN 0 ELSE 1 END "
                        + "AND peer_r.id<r.id))))"
        );
    }
}
