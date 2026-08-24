package com.whiskeygallery_review.review_api.repository;
import com.querydsl.core.BooleanBuilder;
import com.whiskeygallery_review.review_api.entity.OtherReview;
import com.whiskeygallery_review.review_api.entity.QOtherReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface OtherReviewRepository extends BaseReviewRepository<OtherReview>{}
//public interface OtherReviewRepository extends JpaRepository<OtherReview, Long>,
//        QuerydslPredicateExecutor<OtherReview> {
//    List<OtherReview> findByTitleContaining(String keyword);
//
//    default Page<OtherReview> searchWithPaging(
//            List<String> andWords,
//            List<String> orWords,
//            String age,
//            String nickname,
//            Pageable pageable) {
//
//        QOtherReview review = QOtherReview.otherReview;
//        BooleanBuilder builder = new BooleanBuilder();
//
//        // age
//        if (age!=null && !age.isEmpty()){
//            builder.and(review.title.containsIgnoreCase(age));
//        }
//
//        // 닉네임 조건
//        if (nickname != null && !nickname.isEmpty()) {
//            builder.and(review.nickname.eq(nickname));
//        }
//
//        // AND 키워드 조건
//        if (andWords != null && !andWords.isEmpty()) {
//            andWords.forEach(word -> builder.and(review.title.containsIgnoreCase(word)));
//        }
//
//        // OR 키워드 조건
//        if (orWords != null && !orWords.isEmpty()) {
//            BooleanBuilder orBuilder = new BooleanBuilder();
//            orWords.forEach(word -> orBuilder.or(review.title.containsIgnoreCase(word)));
//            builder.and(orBuilder);
//        }
//        System.out.println(builder.getValue());
//
//        return findAll(builder, pageable);
//    }
//}
