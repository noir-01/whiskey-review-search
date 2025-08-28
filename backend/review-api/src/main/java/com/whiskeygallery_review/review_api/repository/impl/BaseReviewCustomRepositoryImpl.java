package com.whiskeygallery_review.review_api.repository.impl;

import com.querydsl.core.BooleanBuilder;
import jakarta.persistence.*;
import com.querydsl.core.types.EntityPath;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.*;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.whiskeygallery_review.review_api.entity.BaseReview;
import com.whiskeygallery_review.review_api.repository.BaseReviewCustomRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

public class BaseReviewCustomRepositoryImpl<T extends BaseReview> implements BaseReviewCustomRepository<T> {

    private final JPAQueryFactory queryFactory;
    private final EntityManager entityManager; // 추가!
    private final EntityPath<T> entityPath;
    private final StringPath titlePath;
    private final StringPath nicknamePath;

    public BaseReviewCustomRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager, EntityPath<T> entityPath, StringPath titlePath, StringPath nicknamePath) {
        this.queryFactory = queryFactory;
        this.entityManager = entityManager;
        this.entityPath = entityPath;
        this.titlePath = titlePath;
        this.nicknamePath = nicknamePath;
    }

//    @Override
//    public Page<T> searchWithPaging(List<String> andWords, List<String> orWords, String age, String nickname, Pageable pageable) {
//        BooleanBuilder builder = new BooleanBuilder();
//
//        if (age != null && !age.isEmpty()) {
//            builder.and(titlePath.containsIgnoreCase(age));
//        }
//        if (nickname != null && !nickname.isEmpty()) {
//            builder.and(nicknamePath.eq(nickname));
//        }
//        if (andWords != null && !andWords.isEmpty()) {
//            andWords.forEach(word -> builder.and(titlePath.containsIgnoreCase(word)));
//        }
//        if (orWords != null && !orWords.isEmpty()) {
//            BooleanBuilder orBuilder = new BooleanBuilder();
//            orWords.forEach(word -> orBuilder.or(titlePath.containsIgnoreCase(word)));
//            builder.and(orBuilder);
//        }
//
//        List<OrderSpecifier<?>> orders = new ArrayList<>();
//        pageable.getSort().forEach(order -> {
//            PathBuilder<?> pathBuilder = new PathBuilder<>(entityPath.getType(), entityPath.getMetadata());
//            String property = order.getProperty();
//
//            // Get the property path with explicit type
//            Path<?> propertyPath = pathBuilder.get(property);
//
//            // Create OrderSpecifier with proper type casting
//            OrderSpecifier<?> orderSpecifier = order.isAscending() ?
//                    new OrderSpecifier(Order.ASC, propertyPath) :
//                    new OrderSpecifier(Order.DESC, propertyPath);
//
//            orders.add(orderSpecifier);
//        });
//
//        // QueryDSL 쿼리에서 정렬 적용
//        JPAQuery<T> query = queryFactory.selectFrom(entityPath)
//                .where(builder)
//                .offset(pageable.getOffset())
//                .limit(pageable.getPageSize());
//
//        if (!orders.isEmpty()) {
//            query.orderBy(orders.toArray(new OrderSpecifier[0]));
//        }
//
//        // 데이터 조회
//        List<T> content = query.fetch();
//
//        // 총 개수 조회
//        long total = queryFactory.selectFrom(entityPath)
//                .where(builder)
//                .fetchCount();
//
//        return new PageImpl<>(content, pageable, total);
//    }
    private String buildMroongaQuery(List<String> andWords, List<String> orWords, String ageKeyword) {
        List<String> queryParts = new ArrayList<>();

        // andWords 처리 (각 단어는 AND 조건)
        if (andWords != null && !andWords.isEmpty()) {
            for (String word : andWords) {
                if (StringUtils.hasText(word)) {
                    String sanitizedWord = sanitizeMroongaSearchTerm(word.trim());
                    // 공백이 포함된 경우 구문 검색으로 처리
                    if (word.trim().contains(" ")) {
                        queryParts.add("+\"" + sanitizedWord + "\"");
                    } else {
                        queryParts.add("+" + sanitizedWord);
                    }
                }
            }
        }
        
        // age는 and 검색
        if (StringUtils.hasText(ageKeyword)) {
            String sanitizedAge = sanitizeMroongaSearchTerm(ageKeyword.trim());
            if (ageKeyword.trim().contains(" ")) {
                queryParts.add("+\"" + sanitizedAge + "\"");
            } else {
                queryParts.add("+" + sanitizedAge);
            }
        }
        
        // or word끼리는 () 안 공백으로 구분, 바깥에 and 검색
        if (orWords != null && !orWords.isEmpty()) {
            List<String> sanitizedOrWords = orWords.stream()
                    .filter(StringUtils::hasText)
                    .map(word -> {
                        String sanitized = sanitizeMroongaSearchTerm(word.trim());
                        return word.trim().contains(" ") ? "\"" + sanitized + "\"" : sanitized;
                    })
                    .toList();

            if (!sanitizedOrWords.isEmpty()) {
                queryParts.add("+(" + String.join(" ", sanitizedOrWords) + ")");
            }
        }
        return String.join(" ", queryParts).trim();
    }

    private String sanitizeMroongaSearchTerm(String term) {
        if (term == null || term.trim().isEmpty()) return "";
        String sanitized = term.trim();
        // 모든 특수문자를 한 번에 이스케이프 처리
        sanitized = sanitized.replaceAll("([+\\-<>()~*\"@.\\\\\\[\\]/])", "\\\\$1");
        sanitized = sanitized.replaceAll("\\s+", " ").trim();

        return sanitized;
    }

    @Override
    public Page<T> searchWithPaging(List<String> andWords, List<String> orWords, String age, String nickname, Pageable pageable) {
        // Mroonga 검색어가 있는 경우 Native Query 사용
        String mroongaSearchQuery = buildMroongaQuery(andWords, orWords, age);
        
        if (StringUtils.hasText(mroongaSearchQuery)) {
            return searchWithNativeQuery(mroongaSearchQuery, nickname, pageable);
        } else {
            // 닉네임만 검색일 경우
            return searchWithQueryDSL(nickname, pageable);
        }
    }

    private Page<T> searchWithNativeQuery(String mroongaSearchQuery, String nickname, Pageable pageable) {
        StringBuilder sql = new StringBuilder();
        sql.append("SELECT * FROM ").append(getTableName()).append(" WHERE ");
        
        List<Object> parameters = new ArrayList<>();
        int paramIndex = 1;
        
        // MATCH AGAINST 조건 추가
        sql.append("MATCH(title) AGAINST (? IN BOOLEAN MODE)");
        parameters.add(mroongaSearchQuery);
        paramIndex++;
        
        // nickname 조건 추가
        if (StringUtils.hasText(nickname)) {
            sql.append(" AND nickname = ?");
            parameters.add(nickname);
            paramIndex++;
        }
        
        // 정렬 추가
        sql.append(" ORDER BY id DESC");
        
        // 페이징 추가
        sql.append(" LIMIT ? OFFSET ?");
        parameters.add(pageable.getPageSize());
        parameters.add(pageable.getOffset());
        
        // 데이터 조회
        Query query = entityManager.createNativeQuery(sql.toString(), entityPath.getType());
        for (int i = 0; i < parameters.size(); i++) {
            query.setParameter(i + 1, parameters.get(i));
        }
        
        List<T> content = query.getResultList();
        
        // 카운트 쿼리
        StringBuilder countSql = new StringBuilder();
        countSql.append("SELECT COUNT(*) FROM ").append(getTableName()).append(" WHERE ");
        countSql.append("MATCH(title) AGAINST (? IN BOOLEAN MODE)");
        
        if (StringUtils.hasText(nickname)) {
            countSql.append(" AND nickname = ?");
        }
        
        Query countQuery = entityManager.createNativeQuery(countSql.toString());
        countQuery.setParameter(1, mroongaSearchQuery);
        if (StringUtils.hasText(nickname)) {
            countQuery.setParameter(2, nickname);
        }
        
        Long total = ((Number) countQuery.getSingleResult()).longValue();
        
        return new PageImpl<>(content, pageable, total);
    }
    private Page<T> searchWithQueryDSL(String nickname, Pageable pageable) {
        BooleanBuilder builder = new BooleanBuilder();

        // 닉네임 조건 추가
        if (StringUtils.hasText(nickname)) {
            builder.and(nicknamePath.eq(nickname));
        }

        // 정렬 조건 적용
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        pageable.getSort().forEach(order -> {
            PathBuilder<?> pathBuilder = new PathBuilder<>(entityPath.getType(), entityPath.getMetadata());
            Path<?> propertyPath = pathBuilder.get(order.getProperty());
            orders.add(order.isAscending() ?
                    new OrderSpecifier(Order.ASC, propertyPath) :
                    new OrderSpecifier(Order.DESC, propertyPath));
        });

        // 쿼리 생성 및 실행
        JPAQuery<T> query = queryFactory.selectFrom(entityPath)
                .where(builder)
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize());

        if (!orders.isEmpty()) {
            query.orderBy(orders.toArray(new OrderSpecifier[0]));
        }

        List<T> content = query.fetch();
        long total = queryFactory.selectFrom(entityPath)
                .where(builder)
                .fetchCount();

        return new PageImpl<>(content, pageable, total);
    }
    private String getTableName() {
        Table table = entityPath.getType().getAnnotation(Table.class);
        if (table != null && !table.name().isEmpty()) {
            return table.name();
        } else {
            // 어노테이션이 없으면 클래스명을 반환 (JPA 기본 규칙)
            return entityPath.getType().getSimpleName();
        }
    }
}

