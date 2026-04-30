package com.peopleground.sagwim.content.infrastructure.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentJpaRepository extends JpaRepository<Content, Long> {

    /**
     * likeCount 원자적 증가. 낙관적 락 대신 DB 레벨 원자 UPDATE로 Lost Update 방지.
     * flushAutomatically로 선행 INSERT 반영, clearAutomatically로 영속성 컨텍스트의 stale Content 제거.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_content c SET c.likeCount = c.likeCount + 1 WHERE c.id = :id")
    int incrementLikeCount(@Param("id") Long id);

    /**
     * likeCount 원자적 감소. 0 미만으로 내려가지 않도록 조건 포함.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_content c SET c.likeCount = c.likeCount - 1 WHERE c.id = :id AND c.likeCount > 0")
    int decrementLikeCount(@Param("id") Long id);

    /**
     * 원자 UPDATE 이후 최신 likeCount 만 가볍게 다시 조회한다.
     * 전체 엔티티 재조회보다 비용이 낮고, 응답 DTO 용으로 충분하다.
     */
    @Query("SELECT c.likeCount FROM p_content c WHERE c.id = :id")
    Integer findLikeCountById(@Param("id") Long id);

    /**
     * commentCount 원자적 1 증가. 동시에 다수 사용자가 댓글을 달 때 Lost Update 방지.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_content c SET c.commentCount = c.commentCount + 1 WHERE c.id = :id")
    int incrementCommentCount(@Param("id") Long id);

    /**
     * commentCount 원자적 1 감소 (0 미만 방지).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE p_content c SET c.commentCount = c.commentCount - 1 WHERE c.id = :id AND c.commentCount > 0")
    int decrementCommentCount(@Param("id") Long id);
}
