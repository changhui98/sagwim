package com.peopleground.sagwim.tag.infrastructure.repository;

import com.peopleground.sagwim.tag.domain.entity.ContentTag;
import com.peopleground.sagwim.tag.domain.entity.QContentTag;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ContentTagQueryRepository {

    private final JPAQueryFactory queryFactory;

    public List<ContentTag> findAllFetchTagByContentIdIn(Collection<Long> contentIds) {
        if (contentIds == null || contentIds.isEmpty()) {
            return List.of();
        }

        QContentTag contentTag = QContentTag.contentTag;
        return queryFactory
            .selectFrom(contentTag)
            .join(contentTag.tag).fetchJoin()
            .where(contentTag.content.id.in(contentIds))
            .fetch();
    }
}
