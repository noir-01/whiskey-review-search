package com.whiskeygallery_review.review_api.service;

import java.util.List;

import com.whiskeygallery_review.review_api.entity.OtherReview;
import com.whiskeygallery_review.review_api.entity.WhiskeyReview;
import com.whiskeygallery_review.review_api.repository.OtherReviewRepository;
import com.whiskeygallery_review.review_api.repository.WhiskeyReviewRepository;
import com.whiskeygallery_review.review_api.dto.ReviewDto;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
public class OtherReviewService extends BaseReviewService<OtherReview> {

    public OtherReviewService(OtherReviewRepository otherReviewRepository) {
        super(otherReviewRepository);
    }

    @Override
    protected ReviewDto toDto(OtherReview review) {
        return new ReviewDto(
                review.getId(),
                review.getTitle() == null ? null : review.getTitle().trim(),
                review.getRecom(),
                review.getReply(),
                review.getNickname(),
                review.getPostDate(),
                review.getCategory(),
                toRouteCategory(review.getCategory())
        );
    }

    //other,distillery_tour의 경우 라우팅 경로는 whiskey로 변경해야 함.
    private String toRouteCategory(String category) {
        return switch (category) {
            case "other", "distillery-tour" -> "whiskey";
            default -> category;
        };
    }
}
