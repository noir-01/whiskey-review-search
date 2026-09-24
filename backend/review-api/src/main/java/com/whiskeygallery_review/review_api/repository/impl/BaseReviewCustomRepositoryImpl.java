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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class BaseReviewCustomRepositoryImpl<T extends BaseReview> implements BaseReviewCustomRepository<T> {

    private final JPAQueryFactory queryFactory;
    private final EntityManager entityManager;
    private final EntityPath<T> entityPath;
    private final StringPath titlePath;
    private final StringPath nicknamePath;
    private final StringPath categoryPath; // nullable - OtherReview 전용
    private final String categoryColumnName;
    private final String entityColumns;
    private final String sourceJoin;
    private final String ungroupedKey;
    private final String representativePriority;
    private final String deduplicationFilter;

    public BaseReviewCustomRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager, EntityPath<T> entityPath, StringPath titlePath, StringPath nicknamePath, StringPath categoryPath) {
        this(queryFactory, entityManager, entityPath, titlePath, nicknamePath, categoryPath,
                categoryPath == null ? null : "category", "id,title,recom,reply,post_date,nickname",
                null, "CAST(r.id AS CHAR)", "0", null);
    }

    public BaseReviewCustomRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager, EntityPath<T> entityPath, StringPath titlePath, StringPath nicknamePath, StringPath categoryPath, String categoryColumnName) {
        this(queryFactory, entityManager, entityPath, titlePath, nicknamePath, categoryPath,
                categoryColumnName, "id,title,recom,reply,post_date,nickname",
                null, "CAST(r.id AS CHAR)", "0", null);
    }

    public BaseReviewCustomRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager,
            EntityPath<T> entityPath, StringPath titlePath, StringPath nicknamePath,
            StringPath categoryPath, String categoryColumnName, String entityColumns,
            String sourceJoin, String ungroupedKey, String representativePriority) {
        this(queryFactory, entityManager, entityPath, titlePath, nicknamePath, categoryPath,
                categoryColumnName, entityColumns, sourceJoin, ungroupedKey,
                representativePriority, null);
    }

    public BaseReviewCustomRepositoryImpl(JPAQueryFactory queryFactory, EntityManager entityManager,
            EntityPath<T> entityPath, StringPath titlePath, StringPath nicknamePath,
            StringPath categoryPath, String categoryColumnName, String entityColumns,
            String sourceJoin, String ungroupedKey, String representativePriority,
            String deduplicationFilter) {
        this.queryFactory = queryFactory;
        this.entityManager = entityManager;
        this.entityPath = entityPath;
        this.titlePath = titlePath;
        this.nicknamePath = nicknamePath;
        this.categoryPath = categoryPath;
        this.categoryColumnName = categoryColumnName;
        this.entityColumns = entityColumns;
        this.sourceJoin = sourceJoin;
        this.ungroupedKey = ungroupedKey;
        this.representativePriority = representativePriority;
        this.deduplicationFilter = deduplicationFilter;
    }

    private String buildMroongaQuery(List<String> andWords, List<String> orWords, String ageKeyword) {
        List<String> queryParts = new ArrayList<>();

        if (andWords != null && !andWords.isEmpty()) {
            for (String word : andWords) {
                if (StringUtils.hasText(word)) {
                    String sanitizedWord = sanitizeMroongaSearchTerm(word.trim());
                    if (word.trim().contains(" ")) {
                        queryParts.add("+\"" + sanitizedWord + "\"");
                    } else {
                        queryParts.add("+" + sanitizedWord);
                    }
                }
            }
        }

        if (StringUtils.hasText(ageKeyword)) {
            String sanitizedAge = sanitizeMroongaSearchTerm(ageKeyword.trim());
            if (ageKeyword.trim().contains(" ")) {
                queryParts.add("+\"" + sanitizedAge + "\"");
            } else {
                queryParts.add("+" + sanitizedAge);
            }
        }

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
        sanitized = sanitized.replaceAll("([+\\-<>()~*\"@.\\\\\\[\\]/])", "\\\\$1");
        sanitized = sanitized.replaceAll("\\s+", " ").trim();
        return sanitized;
    }

    @Override
    public Page<T> searchWithPaging(List<String> andWords, List<String> orWords, String age, String nickname, String notWord, List<String> categories, Pageable pageable) {
        if (categories != null && categories.isEmpty()) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        String mroongaSearchQuery = buildMroongaQuery(andWords, orWords, age);

        if (StringUtils.hasText(notWord)) {
            String sanitizedNot = sanitizeMroongaSearchTerm(notWord.trim());
            String notPart = notWord.trim().contains(" ") ? "-\"" + sanitizedNot + "\"" : "-" + sanitizedNot;
            mroongaSearchQuery = StringUtils.hasText(mroongaSearchQuery)
                    ? mroongaSearchQuery + " " + notPart
                    : notPart;
        }

        if (StringUtils.hasText(mroongaSearchQuery)) {
            return searchWithNativeQuery(mroongaSearchQuery, nickname, categories, pageable);
        } else {
            StringBuilder whereClause = new StringBuilder("1=1");
            List<Object> whereParams = new ArrayList<>();
            appendNativeFilters(whereClause, whereParams, nickname, categories);
            return executeDeduplicatedNativeQuery(whereClause.toString(), whereParams, pageable);
        }
    }

    private Page<T> searchWithNativeQuery(String mroongaSearchQuery, String nickname, List<String> categories, Pageable pageable) {
        StringBuilder whereClause = new StringBuilder("MATCH(r.title) AGAINST (? IN BOOLEAN MODE)");
        List<Object> whereParams = new ArrayList<>();
        whereParams.add(mroongaSearchQuery);

        appendNativeFilters(whereClause, whereParams, nickname, categories);
        return executeDeduplicatedNativeQuery(whereClause.toString(), whereParams, pageable);
    }

    private void appendNativeFilters(StringBuilder whereClause, List<Object> whereParams,
            String nickname, List<String> categories) {
        if (StringUtils.hasText(nickname)) {
            whereClause.append(" AND r.nickname = ?");
            whereParams.add(nickname);
        }
        if (categories != null && !categories.isEmpty()) {
            if (!StringUtils.hasText(categoryColumnName)) {
                throw new IllegalStateException("A category filter was supplied without a category column");
            }
            whereClause.append(" AND r.").append(categoryColumnName).append(" IN (");
            for (int i = 0; i < categories.size(); i++) {
                if (i > 0) whereClause.append(", ");
                whereClause.append("?");
            }
            whereClause.append(")");
            whereParams.addAll(categories);
        }
    }

    private Page<T> executeDeduplicatedNativeQuery(String whereClause, List<Object> whereParams, Pageable pageable) {
        String rankedQuery = buildRankedQuery(whereClause);
        String orderColumn = pageable.getSort().stream().findFirst()
                .map(order -> switch (order.getProperty()) {
                    case "postDate" -> "post_date";
                    case "recom" -> "recom";
                    case "reply" -> "reply";
                    default -> "id";
                }).orElse("id");
        String orderDirection = pageable.getSort().stream().findFirst()
                .map(order -> order.isAscending() ? "ASC" : "DESC").orElse("DESC");
        List<Object> dataParams = new ArrayList<>(whereParams);
        dataParams.add(pageable.getPageSize());
        dataParams.add(pageable.getOffset());

        Query query = entityManager.createNativeQuery(
                "SELECT " + prefixedEntityColumns("ranked") + " FROM (" + rankedQuery
                        + ") ranked WHERE duplicate_rank=1 ORDER BY ranked." + orderColumn + " "
                        + orderDirection + ", ranked.id DESC LIMIT ? OFFSET ?",
                entityPath.getType());
        for (int i = 0; i < dataParams.size(); i++) {
            query.setParameter(i + 1, dataParams.get(i));
        }
        List<T> content = query.getResultList();

        Query countQuery = entityManager.createNativeQuery(
                "SELECT COUNT(*) FROM (" + rankedQuery + ") ranked WHERE duplicate_rank=1"
        );
        for (int i = 0; i < whereParams.size(); i++) {
            countQuery.setParameter(i + 1, whereParams.get(i));
        }
        Long total = ((Number) countQuery.getSingleResult()).longValue();

        return new PageImpl<>(content, pageable, total);
    }

    private String buildRankedQuery(String whereClause) {
        if (!StringUtils.hasText(sourceJoin)) {
            return "SELECT r.*,1 AS duplicate_rank FROM " + getTableName() + " r WHERE " + whereClause;
        }
        if (StringUtils.hasText(deduplicationFilter)) {
            return "SELECT r.*,1 AS duplicate_rank FROM " + getTableName() + " r " + sourceJoin
                    + " LEFT JOIN review_duplicate_member dm ON dm.source_id=cs.id WHERE ("
                    + whereClause + ") AND (" + deduplicationFilter + ")";
        }
        return "SELECT r.*,ROW_NUMBER() OVER (PARTITION BY COALESCE(CONCAT('group:',dm.group_id),"
                + "CONCAT('single:'," + ungroupedKey + ")) ORDER BY "
                + "COALESCE(cs.published_at,TIMESTAMP(r.post_date)) ASC,"
                + representativePriority + ",r.id ASC) AS duplicate_rank FROM "
                + getTableName() + " r " + sourceJoin
                + " LEFT JOIN review_duplicate_member dm ON dm.source_id=cs.id WHERE " + whereClause;
    }

    private String prefixedEntityColumns(String alias) {
        return Arrays.stream(entityColumns.split(","))
                .map(String::trim)
                .map(column -> alias + "." + column)
                .collect(Collectors.joining(","));
    }

    private Page<T> searchWithQueryDSL(String nickname, List<String> categories, Pageable pageable) {
        BooleanBuilder builder = new BooleanBuilder();

        if (StringUtils.hasText(nickname)) {
            builder.and(nicknamePath.eq(nickname));
        }

        if (categories != null && !categories.isEmpty() && categoryPath != null) {
            builder.and(categoryPath.in(categories));
        }

        List<OrderSpecifier<?>> orders = new ArrayList<>();
        pageable.getSort().forEach(order -> {
            PathBuilder<?> pathBuilder = new PathBuilder<>(entityPath.getType(), entityPath.getMetadata());
            Path<?> propertyPath = pathBuilder.get(order.getProperty());
            orders.add(order.isAscending() ?
                    new OrderSpecifier(Order.ASC, propertyPath) :
                    new OrderSpecifier(Order.DESC, propertyPath));
        });

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
            return entityPath.getType().getSimpleName();
        }
    }
}
