package com.whiskeygallery_review.review_api.repository.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.whiskeygallery_review.review_api.entity.QWhiskeyReview;
import com.whiskeygallery_review.review_api.entity.WhiskeyReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewCustomRepository;
import jakarta.persistence.EntityManager;

public class WhiskeyReviewRepositoryImpl extends BaseReviewCustomRepositoryImpl<WhiskeyReview> implements BaseReviewCustomRepository<WhiskeyReview> {
    public WhiskeyReviewRepositoryImpl(
        JPAQueryFactory queryFactory,
        EntityManager entityManager
        ) {
        super(queryFactory, entityManager, QWhiskeyReview.whiskeyReview, QWhiskeyReview.whiskeyReview.title, QWhiskeyReview.whiskeyReview.nickname, null);
    }
}
