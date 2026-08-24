package com.whiskeygallery_review.review_api.controller;
import com.whiskeygallery_review.review_api.dto.ReviewDto;
import com.whiskeygallery_review.review_api.service.OtherReviewService;
import com.whiskeygallery_review.review_api.service.LiquorReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review")
public class ReviewController {
    @Autowired
    private final LiquorReviewService liquorReviewService;
    private final OtherReviewService otherReviewService;

    public ReviewController(LiquorReviewService liquorReviewService, OtherReviewService otherReviewService) {
        this.liquorReviewService = liquorReviewService;
        this.otherReviewService = otherReviewService;
    }

    @GetMapping("/other")
    public Page<ReviewDto> getOtherReviews(
            @RequestParam(required = false) List<String> andWords,
            @RequestParam(required = false) List<String> orWords,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String notWord,
            @RequestParam(required = false) List<String> gallIds,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postDate") String sortField,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.valueOf(direction.toUpperCase());
        Sort sort = Sort.by(sortDirection, sortField);
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        return otherReviewService.searchDtoWithPagingByGallIds(andWords, orWords, age, gallIds, nickname, notWord, pageRequest);
    }

    @GetMapping("/whiskey")
    public Page<ReviewDto> searchReviews(
            @RequestParam(required = false) List<String> andWords,
            @RequestParam(required = false) List<String> orWords,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String notWord,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortField,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.valueOf(direction.toUpperCase());
        Sort sort = Sort.by(sortDirection, sortField);
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        return liquorReviewService.searchDtoWithPaging(andWords, orWords, age, nickname, notWord, pageRequest);
    }
}
