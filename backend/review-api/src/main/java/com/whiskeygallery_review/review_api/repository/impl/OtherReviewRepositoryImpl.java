package com.whiskeygallery_review.review_api.repository.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.whiskeygallery_review.review_api.entity.OtherReview;
import com.whiskeygallery_review.review_api.entity.QOtherReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewCustomRepository;
import jakarta.persistence.EntityManager;

public class OtherReviewRepositoryImpl extends BaseReviewCustomRepositoryImpl<OtherReview> implements BaseReviewCustomRepository<OtherReview> {
    public OtherReviewRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager) {
        super(queryFactory, entityManager, QOtherReview.otherReview,
                QOtherReview.otherReview.title, QOtherReview.otherReview.nickname,
                QOtherReview.otherReview.category, "category",
                "id,title,recom,reply,post_date,nickname,category",
                "LEFT JOIN crawl_review_source cs ON cs.db_category COLLATE utf8mb4_general_ci=r.category AND cs.post_id=r.id",
                "CONCAT(r.category,':',r.id)",
                "CASE WHEN r.category IN ('other','distillery-tour') THEN 0 ELSE 1 END");
    }
}
