package com.whiskeygallery_review.review_api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "liquor_review")
public class LiquorReview extends BaseReview {
    @Column(name = "gallery_id", nullable = false, length = 64)
    private String galleryId;

    @Column(name = "post_id", nullable = false)
    private Integer postId;

    @Column(name = "tab_key", nullable = false, length = 64)
    private String tabKey;
}
