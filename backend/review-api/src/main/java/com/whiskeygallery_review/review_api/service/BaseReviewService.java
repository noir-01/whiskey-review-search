package com.whiskeygallery_review.review_api.service;

import com.whiskeygallery_review.review_api.entity.BaseReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewRepository;
import com.whiskeygallery_review.review_api.dto.ReviewDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public abstract class BaseReviewService<T extends BaseReview> {

    protected final BaseReviewRepository<T> baseReviewRepository;

    protected BaseReviewService(BaseReviewRepository<T> baseReviewRepository) {
        this.baseReviewRepository = baseReviewRepository;
    }

    public Page<ReviewDto> searchDtoWithPaging(
            List<String> andWords,
            List<String> orWords,
            String age,
            String nickname,
            String notWord,
            Pageable pageable
    ) {
        return searchDtoWithPaging(andWords, orWords, age, nickname, notWord, null, pageable);
    }

    public Page<ReviewDto> searchDtoWithPaging(
            List<String> andWords,
            List<String> orWords,
            String age,
            String nickname,
            String notWord,
            List<String> categories,
            Pageable pageable
    ) {
        return baseReviewRepository.searchWithPaging(andWords, orWords, age, nickname, notWord, categories, pageable)
                .map(this::toDto);
    }

    protected abstract ReviewDto toDto(T review);


    public Optional<T> findById(Long id) {
        return baseReviewRepository.findById(id);
    }

//    public T save(T entity) {
//        return baseReviewRepository.save(entity);
//    }

    public void delete(T entity) {
        baseReviewRepository.delete(entity);
    }

    // 필요하면 추가 (ex. findAll 등)
}

