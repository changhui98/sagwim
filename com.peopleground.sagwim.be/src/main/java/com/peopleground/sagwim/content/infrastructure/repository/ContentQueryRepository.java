package com.peopleground.sagwim.content.infrastructure.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.entity.QContent;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import com.peopleground.sagwim.tag.domain.entity.QContentTag;
import com.peopleground.sagwim.tag.domain.entity.QTag;
import com.peopleground.sagwim.user.domain.entity.QUser;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ContentQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Optional<Content> findById(Long id) {

        QContent content = QContent.content;

        return Optional.ofNullable(
            queryFactory
                .selectFrom(content)
                .where(
                    content.id.eq(id),
                    content.deletedDate.isNull()
                )
                .fetchOne()
        );
    }

    public Optional<Content> findByIdIncludingDeleted(Long id) {

        QContent content = QContent.content;

        return Optional.ofNullable(
            queryFactory
                .selectFrom(content)
                .where(content.id.eq(id))
                .fetchOne()
        );
    }

    public Page<Content> findAllContents(Pageable pageable) {

        QContent content = QContent.content;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .where(content.deletedDate.isNull())
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .where(content.deletedDate.isNull())
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    /**
     * groupId가 null인 게시글만 조회한다. 전체 피드에서 모임 게시글을 제외할 때 사용한다.
     */
    public Page<Content> findAllContentsWithoutGroup(Pageable pageable) {

        QContent content = QContent.content;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .where(
                content.deletedDate.isNull(),
                content.groupId.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .where(
                content.deletedDate.isNull(),
                content.groupId.isNull()
            )
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    /**
     * 특정 모임(groupId)에 속한 삭제되지 않은 게시글을 최신순으로 반환한다.
     */
    public Page<Content> findAllByGroupId(Long groupId, Pageable pageable) {

        QContent content = QContent.content;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .where(
                content.groupId.eq(groupId),
                content.deletedDate.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .where(
                content.groupId.eq(groupId),
                content.deletedDate.isNull()
            )
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    public Page<Content> findAllContentsIncludingDeleted(Pageable pageable) {

        QContent content = QContent.content;
        QUser user = QUser.user;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .join(content.user, user).fetchJoin()
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    /**
     * 특정 username(로그인 ID) 에 해당하는 작성자의 삭제되지 않은 글만 최신순으로 반환한다.
     * containsIgnoreCase 가 아닌 정확 일치(eq) 를 사용해야 "내 글" 목록이 오염되지 않는다.
     * groupId가 null인 게시글(모임 게시글 제외)만 반환한다.
     */
    public Page<Content> findAllByUsername(String username, Pageable pageable) {

        QContent content = QContent.content;
        QUser user = QUser.user;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .join(content.user, user)
            .where(
                user.username.eq(username),
                content.deletedDate.isNull(),
                content.groupId.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .join(content.user, user)
            .where(
                user.username.eq(username),
                content.deletedDate.isNull(),
                content.groupId.isNull()
            )
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    public Page<Content> searchContents(String keyword, SearchType searchType, Pageable pageable) {

        QContent content = QContent.content;
        QUser user = QUser.user;
        BooleanBuilder condition = buildSearchCondition(content, user, keyword, searchType);
        condition.and(content.deletedDate.isNull());

        List<Content> contents = queryFactory
            .selectFrom(content)
            .join(content.user, user)
            .where(condition)
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .join(content.user, user)
            .where(condition)
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    public Page<Content> searchContentsIncludingDeleted(String keyword, SearchType searchType, Pageable pageable) {

        QContent content = QContent.content;
        QUser user = QUser.user;
        BooleanBuilder condition = buildSearchCondition(content, user, keyword, searchType);

        List<Content> contents = queryFactory
            .selectFrom(content)
            .join(content.user, user)
            .where(condition)
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .join(content.user, user)
            .where(condition)
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    /**
     * 특정 태그명으로 게시글 목록을 조회한다.
     * ContentTag 조인을 통해 태그가 연결된 삭제되지 않은 게시글만 반환한다.
     */
    public Page<Content> findAllByTagName(String tagName, Pageable pageable) {

        QContent content = QContent.content;
        QContentTag contentTag = QContentTag.contentTag;
        QTag tag = QTag.tag;

        List<Content> contents = queryFactory
            .selectFrom(content)
            .join(contentTag).on(contentTag.content.eq(content))
            .join(contentTag.tag, tag)
            .where(
                tag.name.eq(tagName.toLowerCase()),
                content.deletedDate.isNull()
            )
            .orderBy(content.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(content.count())
            .from(content)
            .join(contentTag).on(contentTag.content.eq(content))
            .join(contentTag.tag, tag)
            .where(
                tag.name.eq(tagName.toLowerCase()),
                content.deletedDate.isNull()
            )
            .fetchOne();

        return new PageImpl<>(contents, pageable, total != null ? total : 0);
    }

    public Map<String, Long> countMonthlyCreations(LocalDateTime windowStart) {

        QContent content = QContent.content;

        // 모든 도메인 시각이 KST 로 저장되므로(별도 타임존 변환 불필요),
        // YYYY-MM 포맷팅만 수행하는 커스텀 HQL 함수(to_char_kst_month)를 사용한다.
        // 함수 등록: global.persistence.PostgresKstFunctionContributor
        StringExpression monthExpr = Expressions.stringTemplate(
            "function('to_char_kst_month', {0})", content.createdDate);

        var countExpr = content.count();

        List<Tuple> results = queryFactory
            .select(monthExpr, countExpr)
            .from(content)
            .where(
                content.deletedDate.isNull(),
                content.createdDate.goe(windowStart)
            )
            .groupBy(monthExpr)
            .orderBy(monthExpr.asc())
            .fetch();

        return results.stream()
            .collect(Collectors.toMap(
                t -> t.get(monthExpr),
                t -> t.get(countExpr),
                (a, b) -> a,
                LinkedHashMap::new
            ));
    }

    private BooleanBuilder buildSearchCondition(QContent content, QUser user, String keyword, SearchType searchType) {

        BooleanBuilder builder = new BooleanBuilder();

        if (keyword == null || keyword.isBlank()) {
            return builder;
        }

        if (searchType == SearchType.USERNAME) {
            builder.and(user.username.containsIgnoreCase(keyword));
        } else {
            builder.and(content.body.containsIgnoreCase(keyword));
        }

        return builder;
    }
}
