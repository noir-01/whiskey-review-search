package com.whiskeygallery_review.review_api.service;

import java.util.List;
import com.whiskeygallery_review.review_api.entity.WhiskeyReview;
import com.whiskeygallery_review.review_api.repository.WhiskeyReviewRepository;
import com.whiskeygallery_review.review_api.dto.ReviewDto;

import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
public class WhiskeyReviewService extends BaseReviewService<WhiskeyReview> {

    public WhiskeyReviewService(WhiskeyReviewRepository whiskeyReviewRepository) {
        super(whiskeyReviewRepository);
    }
    //WhiskeyReview는 카테고리 수동으로 붙여서 반환(DB에 열 존재 X)
    @Override
    protected ReviewDto toDto(WhiskeyReview review) {
        return new ReviewDto(
                review.getId(),
                review.getTitle() == null ? null : review.getTitle().trim(),
                review.getRecom(),
                review.getReply(),
                review.getNickname(),
                review.getPostDate(),
                "whiskey",  //category=whiskey, gallId=whiskey
                "whiskey"
        );
    }
}
