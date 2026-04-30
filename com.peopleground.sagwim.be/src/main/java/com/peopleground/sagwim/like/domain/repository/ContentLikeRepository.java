package com.peopleground.sagwim.like.domain.repository;

import com.peopleground.sagwim.like.domain.entity.ContentLike;
import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface ContentLikeRepository {

    ContentLike save(ContentLike contentLike);

    Optional<ContentLike> findByContentIdAndUserId(Long contentId, UUID userId);

    boolean existsByContentIdAndUserId(Long contentId, UUID userId);

    void delete(ContentLike contentLike);

    /**
     * 동시성-안전 좋아요 삽입. UNIQUE (content_id, user_id) 경합이 발생해도
     * 예외 없이 실제 삽입된 행 수(0 또는 1)를 반환한다.
     */
    int insertIfNotExists(Long contentId, UUID userId);

    /**
     * 특정 사용자가 좋아요 누른 게시글 id 집합을 배치 조회한다.
     *
     * <p>게시글 리스트 렌더링 시 각 게시글마다 "내가 좋아요 눌렀는지" 를 확인해야 하는데,
     * 건마다 쿼리를 날리면 N+1 이 된다. 대신 현재 페이지의 모든 contentId 를 한 번에 넘겨
     * 좋아요 row 가 존재하는 id 만 받아온다.</p>
     *
     * @return 입력 contentIds 중 해당 사용자가 좋아요 누른 것들의 id 집합 (없으면 빈 집합)
     */
    Set<Long> findLikedContentIds(UUID userId, Collection<Long> contentIds);
}
