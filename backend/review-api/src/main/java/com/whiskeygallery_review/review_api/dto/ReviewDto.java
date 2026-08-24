package com.whiskeygallery_review.review_api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class ReviewDto {
    private Integer id;
    private String title;
    private Integer recommend;
    private Integer reply;
    private String nickname;
    private LocalDate postDate;
    private String category;
    private String gallId;
}
