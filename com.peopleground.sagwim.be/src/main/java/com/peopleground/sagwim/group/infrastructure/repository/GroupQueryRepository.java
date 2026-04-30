package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.QGroup;
import com.peopleground.sagwim.group.domain.entity.QGroupMember;
import com.peopleground.sagwim.user.domain.entity.QUser;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

// 빌드 후 Q클래스 자동 생성됨 (QGroup.group, QGroupMember.groupMember, QUser.user)
@Repository
@RequiredArgsConstructor
public class GroupQueryRepository {

    private final JPAQueryFactory queryFactory;

    public Optional<Group> findById(Long id) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;

        return Optional.ofNullable(
            queryFactory
                .selectFrom(group)
                .join(group.leader, leader).fetchJoin()
                .where(
                    group.id.eq(id),
                    group.deletedDate.isNull()
                )
                .fetchOne()
        );
    }

    public Page<Group> findAll(Pageable pageable, String keyword, GroupCategory category) {
        QGroup group = QGroup.group;

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(group.deletedDate.isNull());

        if (keyword != null && !keyword.isBlank()) {
            builder.and(group.name.containsIgnoreCase(keyword));
        }
        if (category != null) {
            builder.and(group.category.eq(category));
        }

        QUser leader = QUser.user;

        List<Group> groups = queryFactory
            .selectFrom(group)
            .join(group.leader, leader).fetchJoin()
            .where(builder)
            .orderBy(group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .where(builder)
            .fetchOne();

        return new PageImpl<>(groups, pageable, total != null ? total : 0);
    }

    /**
     * 생성된 지 7일 미만인 신규 모임을 최신순으로 조회합니다.
     * KST 기준으로 now - 7days 이후 생성된 모임만 포함합니다.
     */
    public Page<Group> findNewGroups(Pageable pageable) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;

        LocalDateTime sevenDaysAgo = LocalDateTime.now(ZoneId.of("Asia/Seoul")).minusDays(7);

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(group.deletedDate.isNull());
        builder.and(group.createdDate.goe(sevenDaysAgo));

        List<Group> groups = queryFactory
            .selectFrom(group)
            .join(group.leader, leader).fetchJoin()
            .where(builder)
            .orderBy(group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .where(builder)
            .fetchOne();

        return new PageImpl<>(groups, pageable, total != null ? total : 0);
    }

    /**
     * 좋아요 수 내림차순으로 모임 목록을 조회합니다 (인기 모임).
     */
    public Page<Group> findPopularGroups(Pageable pageable) {
        QGroup group = QGroup.group;
        QUser leader = QUser.user;

        List<Group> groups = queryFactory
            .selectFrom(group)
            .join(group.leader, leader).fetchJoin()
            .where(group.deletedDate.isNull(), group.likeCount.goe(1))
            .orderBy(group.likeCount.desc(), group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .where(group.deletedDate.isNull(), group.likeCount.goe(1))
            .fetchOne();

        return new PageImpl<>(groups, pageable, total != null ? total : 0);
    }

    public Page<Group> findByMemberUsername(String username, Pageable pageable) {
        QGroup group = QGroup.group;
        QGroupMember groupMember = QGroupMember.groupMember;
        QUser user = new QUser("memberUser");
        QUser leader = new QUser("leader");

        List<Group> groups = queryFactory
            .selectFrom(group)
            .join(group.leader, leader).fetchJoin()
            .join(groupMember).on(groupMember.group.eq(group))
            .join(groupMember.user, user)
            .where(
                user.username.eq(username),
                group.deletedDate.isNull(),
                groupMember.deletedDate.isNull()
            )
            .orderBy(group.createdDate.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();

        Long total = queryFactory
            .select(group.count())
            .from(group)
            .join(groupMember).on(groupMember.group.eq(group))
            .join(groupMember.user, user)
            .where(
                user.username.eq(username),
                group.deletedDate.isNull(),
                groupMember.deletedDate.isNull()
            )
            .fetchOne();

        return new PageImpl<>(groups, pageable, total != null ? total : 0);
    }
}
