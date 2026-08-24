package com.whiskeygallery_review.review_api.service;

import com.whiskeygallery_review.review_api.dto.ReviewDto;
import com.whiskeygallery_review.review_api.entity.LiquorReview;
import com.whiskeygallery_review.review_api.repository.LiquorReviewRepository;
import org.springframework.stereotype.Service;

@Service
public class LiquorReviewService extends BaseReviewService<LiquorReview> {

    public LiquorReviewService(LiquorReviewRepository liquorReviewRepository) {
        super(liquorReviewRepository);
    }

    @Override
    protected ReviewDto toDto(LiquorReview review) {
        return new ReviewDto(
                review.getPostId(),
                review.getTitle() == null ? null : review.getTitle().trim(),
                review.getRecom(),
                review.getReply(),
                review.getNickname(),
                review.getPostDate(),
                "whiskey",
                review.getGalleryId()
        );
    }
}
