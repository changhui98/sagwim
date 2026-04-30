package com.peopleground.sagwim.comment.infrastructure.repository;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import com.peopleground.sagwim.comment.domain.entity.QComment;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CommentQueryRepository {

    private final JPAQueryFactory queryFactory;

    /**
     * 게시글의 최상위 댓글을 커서 기반 페이지네이션으로 조회한다.
     * 소프트 삭제된 댓글도 포함하되(대댓글 구조 유지), body 는 응답 DTO 에서 치환한다.
     *
     * <p>author LAZY 로딩 N+1 을 막기 위해 {@code fetchJoin} 으로 User 를 함께 가져온다.
     * 호출측은 hasNext 판정을 위해 size + 1 을 요청할 수 있다.</p>
     */
    public List<Comment> findTopCommentsByContentId(Long contentId, Long cursorId, int size) {
        QComment comment = QComment.comment;

        var query = queryFactory
            .selectFrom(comment)
            .join(comment.author).fetchJoin()
            .where(
                comment.content.id.eq(contentId),
                comment.parent.isNull()
            );

        if (cursorId != null) {
            query = query.where(comment.id.gt(cursorId));
        }

        return query
            .orderBy(comment.createdDate.asc())
            .limit(size)
            .fetch();
    }

    /**
     * 특정 댓글의 대댓글 목록 전체를 조회한다. (createdDate 오름차순)
     * 소프트 삭제된 대댓글도 포함한다.
     *
     * <p>단건 부모 조회용. 다수 부모에 대해서는 {@link #findRepliesGroupedByParentIds(List)}
     * 를 사용해 N+1 을 회피한다.</p>
     */
    public List<Comment> findRepliesByParentId(Long parentId) {
        QComment comment = QComment.comment;

        return queryFactory
            .selectFrom(comment)
            .join(comment.author).fetchJoin()
            .where(comment.parent.id.eq(parentId))
            .orderBy(comment.createdDate.asc())
            .fetch();
    }

    /**
     * 여러 부모 댓글 id 에 대한 대댓글을 한 번의 쿼리로 조회해 parentId 별로 그룹핑한다.
     * author 를 fetchJoin 하여 대댓글 author LAZY N+1 까지 함께 해결한다.
     */
    public Map<Long, List<Comment>> findRepliesGroupedByParentIds(List<Long> parentIds) {
        if (parentIds == null || parentIds.isEmpty()) {
            return Map.of();
        }

        QComment comment = QComment.comment;

        List<Comment> replies = queryFactory
            .selectFrom(comment)
            .join(comment.author).fetchJoin()
            .where(comment.parent.id.in(parentIds))
            .orderBy(comment.createdDate.asc())
            .fetch();

        return replies.stream()
            .collect(Collectors.groupingBy(r -> r.getParent().getId()));
    }

    /**
     * 게시글의 삭제되지 않은 댓글 수를 반환한다. (commentCount 동기화용)
     */
    public int countByContentId(Long contentId) {
        QComment comment = QComment.comment;

        Long count = queryFactory
            .select(comment.count())
            .from(comment)
            .where(
                comment.content.id.eq(contentId),
                comment.deletedDate.isNull()
            )
            .fetchOne();

        return count != null ? count.intValue() : 0;
    }
}
