package com.peopleground.sagwim.tag.infrastructure.repository;

import com.peopleground.sagwim.tag.domain.entity.QTag;
import com.peopleground.sagwim.tag.domain.entity.Tag;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class TagQueryRepository {

    private final JPAQueryFactory queryFactory;

    public List<Tag> findTopByPostCount(int limit) {
        QTag tag = QTag.tag;

        return queryFactory
            .selectFrom(tag)
            .where(tag.postCount.gt(0))
            .orderBy(tag.postCount.desc())
            .limit(limit)
            .fetch();
    }

    public List<Tag> searchByNameContaining(String keyword, int limit) {
        QTag tag = QTag.tag;

        return queryFactory
            .selectFrom(tag)
            .where(tag.name.containsIgnoreCase(keyword))
            .orderBy(tag.postCount.desc())
            .limit(limit)
            .fetch();
    }
}
