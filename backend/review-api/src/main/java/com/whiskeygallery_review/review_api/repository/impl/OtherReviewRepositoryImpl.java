package com.whiskeygallery_review.review_api.repository.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.whiskeygallery_review.review_api.entity.OtherReview;
import com.whiskeygallery_review.review_api.entity.QOtherReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewCustomRepository;
import jakarta.persistence.EntityManager;

public class OtherReviewRepositoryImpl extends BaseReviewCustomRepositoryImpl<OtherReview> implements BaseReviewCustomRepository<OtherReview> {
    public OtherReviewRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager) {
        super(queryFactory, entityManager, QOtherReview.otherReview, QOtherReview.otherReview.title, QOtherReview.otherReview.nickname, QOtherReview.otherReview.category);
    }
}
