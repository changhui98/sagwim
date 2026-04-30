package com.peopleground.sagwim.like.domain.repository;

import com.peopleground.sagwim.like.domain.entity.CommentLike;
import java.util.Optional;
import java.util.UUID;

public interface CommentLikeRepository {

    CommentLike save(CommentLike commentLike);

    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, UUID userId);

    boolean existsByCommentIdAndUserId(Long commentId, UUID userId);

    void delete(CommentLike commentLike);

    /**
     * 동시성-안전 좋아요 삽입. UNIQUE (comment_id, user_id) 경합이 발생해도
     * 예외 없이 실제 삽입된 행 수(0 또는 1)를 반환한다.
     */
    int insertIfNotExists(Long commentId, UUID userId);
}
