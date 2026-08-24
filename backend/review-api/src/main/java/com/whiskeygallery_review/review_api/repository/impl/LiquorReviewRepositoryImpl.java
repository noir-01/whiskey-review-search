package com.whiskeygallery_review.review_api.repository.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.whiskeygallery_review.review_api.entity.LiquorReview;
import com.whiskeygallery_review.review_api.entity.QLiquorReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewCustomRepository;
import jakarta.persistence.EntityManager;

public class LiquorReviewRepositoryImpl extends BaseReviewCustomRepositoryImpl<LiquorReview>
        implements BaseReviewCustomRepository<LiquorReview> {

    public LiquorReviewRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager) {
        super(
                queryFactory,
                entityManager,
                QLiquorReview.liquorReview,
                QLiquorReview.liquorReview.title,
                QLiquorReview.liquorReview.nickname,
                QLiquorReview.liquorReview.galleryId,
                "gallery_id"
        );
    }
}
