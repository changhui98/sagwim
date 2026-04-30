package com.peopleground.sagwim.like.infrastructure.repository;

import com.peopleground.sagwim.like.domain.entity.CommentLike;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentLikeJpaRepository extends JpaRepository<CommentLike, Long> {

    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, UUID userId);

    boolean existsByCommentIdAndUserId(Long commentId, UUID userId);

    /**
     * 댓글 좋아요를 ON CONFLICT DO NOTHING 으로 멱등하게 삽입한다. 상세 주석은
     * ContentLikeJpaRepository#insertIfNotExists 참조.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = "INSERT INTO p_comment_like (comment_id, user_id, created_date, last_modified_date) "
            + "VALUES (:commentId, :userId, NOW(), NOW()) "
            + "ON CONFLICT ON CONSTRAINT uk_comment_like_comment_user DO NOTHING",
        nativeQuery = true
    )
    int insertIfNotExists(@Param("commentId") Long commentId, @Param("userId") UUID userId);
}
