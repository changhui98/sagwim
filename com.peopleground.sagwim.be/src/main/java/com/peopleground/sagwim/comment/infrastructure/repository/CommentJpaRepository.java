package com.peopleground.sagwim.comment.infrastructure.repository;

import com.peopleground.sagwim.comment.domain.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentJpaRepository extends JpaRepository<Comment, Long> {

    /**
     * likeCount 원자적 증가. Entity 필드 ++ 대신 DB 레벨 UPDATE 로 Lost Update 방지.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_comment c SET c.likeCount = c.likeCount + 1 WHERE c.id = :id")
    int incrementLikeCount(@Param("id") Long id);

    /**
     * likeCount 원자적 감소 (0 미만 방지).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_comment c SET c.likeCount = c.likeCount - 1 WHERE c.id = :id AND c.likeCount > 0")
    int decrementLikeCount(@Param("id") Long id);

    /**
     * 원자 UPDATE 이후 최신 likeCount 만 가볍게 재조회한다.
     */
    @Query("SELECT c.likeCount FROM p_comment c WHERE c.id = :id")
    Integer findLikeCountById(@Param("id") Long id);
}
