package com.whiskeygallery_review.review_api.repository;

import com.whiskeygallery_review.review_api.entity.BaseReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

//paging 적용 위한 custom repo, custom 사용 안할 시 jpaRepo 직접 implement(불가능)
public interface BaseReviewCustomRepository<T extends BaseReview> {

    Page<T> searchWithPaging(List<String> andWords, List<String> orWords, String age, String nickname, String notWord, List<String> categories, Pageable pageable);
}

