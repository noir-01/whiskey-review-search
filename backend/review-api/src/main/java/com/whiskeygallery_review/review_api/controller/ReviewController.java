package com.whiskeygallery_review.review_api.controller;
import com.whiskeygallery_review.review_api.dto.ReviewDto;
import com.whiskeygallery_review.review_api.service.OtherReviewService;
import com.whiskeygallery_review.review_api.service.WhiskeyReviewService;
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
    private final WhiskeyReviewService whiskeyReviewService;
    private final OtherReviewService otherReviewService;

    public ReviewController(WhiskeyReviewService whiskeyReviewService, OtherReviewService otherReviewService) {
        this.whiskeyReviewService = whiskeyReviewService;
        this.otherReviewService = otherReviewService;
    }

    @GetMapping("/other")
    public Page<ReviewDto> getOtherReviews(
            @RequestParam(required = false) List<String> andWords,
            @RequestParam(required = false) List<String> orWords,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String nickname,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "postDate") String sortField,
            @RequestParam(defaultValue = "DESC") String direction) {

        Sort.Direction sortDirection = Sort.Direction.valueOf(direction.toUpperCase());
        Sort sort = Sort.by(sortDirection, sortField);
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        
        return otherReviewService.searchDtoWithPaging(andWords, orWords, age, nickname, pageRequest);
    }
    @GetMapping("/whiskey")
    public Page<ReviewDto> searchReviews(
            @RequestParam(required = false) List<String> andWords,
            @RequestParam(required = false) List<String> orWords,
            @RequestParam(required = false) String age,
            @RequestParam(required = false) String nickname,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortField,
            @RequestParam(defaultValue = "DESC") String direction) {

        if(andWords!=null){
            System.out.println(String.join(", ", andWords));
        }

        Sort.Direction sortDirection = Sort.Direction.valueOf(direction.toUpperCase());
        Sort sort = Sort.by(sortDirection, sortField);
        PageRequest pageRequest = PageRequest.of(page, size, sort);

        return whiskeyReviewService.searchDtoWithPaging(andWords, orWords, age, nickname, pageRequest);
    }
}
