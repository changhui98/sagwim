package com.peopleground.sagwim.like.infrastructure.repository;

import com.peopleground.sagwim.like.domain.entity.ContentLike;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentLikeJpaRepository extends JpaRepository<ContentLike, Long> {

    Optional<ContentLike> findByContentIdAndUserId(Long contentId, UUID userId);

    boolean existsByContentIdAndUserId(Long contentId, UUID userId);

    /**
     * 특정 사용자가 좋아요 누른 게시글 id 만 배치로 조회한다.
     *
     * <p>리스트/검색 조회 시 N+1 을 피하기 위해 게시글 id 집합을 한 번에 내려,
     * 해당 사용자의 좋아요 row 가 존재하는 contentId 만 뽑아 반환한다.
     * 호출부는 반환된 Set 을 {@code contains(id)} 로 likedByMe 플래그를 채우면 된다.</p>
     */
    @Query("SELECT cl.content.id FROM p_content_like cl "
        + "WHERE cl.user.id = :userId AND cl.content.id IN :contentIds")
    List<Long> findLikedContentIds(
        @Param("userId") UUID userId,
        @Param("contentIds") Collection<Long> contentIds
    );

    /**
     * PostgreSQL ON CONFLICT DO NOTHING 패턴으로 동시성-안전 삽입을 수행한다.
     *
     * <p>동시에 동일 사용자가 좋아요를 두 번 누르더라도 UNIQUE 위반 예외를 던지지 않고,
     * 실제 INSERT 가 수행된 행 수(0 또는 1)를 돌려준다. 호출자는 반환 값이 1 일 때만
     * likeCount 를 원자적으로 증가시키면 된다.</p>
     *
     * <p>영속성 컨텍스트를 거치지 않는 native SQL 이므로, 선행 INSERT 가 있는 경우를 대비해
     * flushAutomatically, clearAutomatically 를 함께 지정한다.</p>
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
        value = "INSERT INTO p_content_like (content_id, user_id, created_date, last_modified_date) "
            + "VALUES (:contentId, :userId, NOW(), NOW()) "
            + "ON CONFLICT ON CONSTRAINT uk_content_like_content_user DO NOTHING",
        nativeQuery = true
    )
    int insertIfNotExists(@Param("contentId") Long contentId, @Param("userId") UUID userId);
}
