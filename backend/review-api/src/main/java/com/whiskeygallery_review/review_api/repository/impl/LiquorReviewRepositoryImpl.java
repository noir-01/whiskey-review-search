package com.whiskeygallery_review.review_api.repository.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.whiskeygallery_review.review_api.entity.LiquorReview;
import com.whiskeygallery_review.review_api.entity.QLiquorReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewCustomRepository;
import jakarta.persistence.EntityManager;

public class LiquorReviewRepositoryImpl extends BaseReviewCustomRepositoryImpl<LiquorReview>
        implements BaseReviewCustomRepository<LiquorReview> {

    /*
     * Older rows predate crawl_review_source, so they cannot belong to an explicitly
     * confirmed duplicate group. For those rows only, collapse a conservative
     * metadata match: same author/date and same title after removing a short review
     * board prefix such as "위위리)" or "옥옥리)".
     */
    private static final String CANONICAL_TITLE =
            "CASE WHEN LOCATE(')',TRIM(r.title)) BETWEEN 1 AND 20 "
                    + "THEN TRIM(SUBSTRING(TRIM(r.title),LOCATE(')',TRIM(r.title))+1)) "
                    + "ELSE TRIM(r.title) END";

    private static final String LEGACY_DUPLICATE_KEY =
            "CASE WHEN dm.group_id IS NULL AND r.nickname IS NOT NULL AND r.post_date IS NOT NULL "
                    + "THEN CONCAT('legacy:',LOWER(" + CANONICAL_TITLE + "),'|',r.nickname,'|',r.post_date) "
                    + "ELSE CONCAT('id:',r.id) END";

    public LiquorReviewRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager) {
        super(
                queryFactory,
                entityManager,
                QLiquorReview.liquorReview,
                QLiquorReview.liquorReview.title,
                QLiquorReview.liquorReview.nickname,
                QLiquorReview.liquorReview.galleryId,
                "gallery_id",
                "id,gallery_id,post_id,tab_key,title,recom,reply,post_date,nickname",
                "LEFT JOIN crawl_review_source cs ON cs.gallery_id COLLATE utf8mb4_general_ci=r.gallery_id AND cs.post_id=r.post_id",
                LEGACY_DUPLICATE_KEY,
                "CASE WHEN r.gallery_id='whiskey' THEN 0 ELSE 1 END"
        );
    }
}
