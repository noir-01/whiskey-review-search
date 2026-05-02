package com.whiskeygallery_review.review_api.service;

import java.util.ArrayList;
import java.util.List;

import com.whiskeygallery_review.review_api.entity.OtherReview;
import com.whiskeygallery_review.review_api.repository.OtherReviewRepository;
import com.whiskeygallery_review.review_api.dto.ReviewDto;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class OtherReviewService extends BaseReviewService<OtherReview> {

    public OtherReviewService(OtherReviewRepository otherReviewRepository) {
        super(otherReviewRepository);
    }

    public Page<ReviewDto> searchDtoWithPagingByGallIds(
            List<String> andWords,
            List<String> orWords,
            String age,
            List<String> gallIds,
            String nickname,
            String notWord,
            Pageable pageable
    ) {
        List<String> categories = gallIdsToDbCategories(gallIds);
        return searchDtoWithPaging(andWords, orWords, age, nickname, notWord, categories, pageable);
    }

    // frontend gallId → DB category 변환
    // "whiskey" gallId는 DB에서 "other", "distillery-tour" 두 카테고리에 해당
    private List<String> gallIdsToDbCategories(List<String> gallIds) {
        if (gallIds == null || gallIds.isEmpty()) return null;
        List<String> categories = new ArrayList<>();
        for (String gallId : gallIds) {
            if ("whiskey".equals(gallId)) {
                categories.add("other");
                categories.add("distillery-tour");
            } else {
                categories.add(gallId);
            }
        }
        return categories;
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
