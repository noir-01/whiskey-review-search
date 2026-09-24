package com.whiskeygallery_review.review_api.service;

import com.whiskeygallery_review.review_api.dto.ReviewDto;
import com.whiskeygallery_review.review_api.entity.LiquorReview;
import com.whiskeygallery_review.review_api.repository.LiquorReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Set;

@Service
public class LiquorReviewService extends BaseReviewService<LiquorReview> {
    private static final Set<String> ALLOWED_GALLERIES = Set.of(
            "whiskey", "isleofjura", "campbeltown", "islay", "oaksusu");

    public LiquorReviewService(LiquorReviewRepository liquorReviewRepository) {
        super(liquorReviewRepository);
    }

    public Page<ReviewDto> searchDtoWithPagingByGallId(
            List<String> andWords, List<String> orWords, String age, String gallId,
            String nickname, String notWord, Pageable pageable) {
        List<String> galleries = gallId == null || gallId.isBlank()
                ? null
                : ALLOWED_GALLERIES.contains(gallId) ? List.of(gallId) : List.of();
        return searchDtoWithPaging(andWords, orWords, age, nickname, notWord, galleries, pageable);
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
