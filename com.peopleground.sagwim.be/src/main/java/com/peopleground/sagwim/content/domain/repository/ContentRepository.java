package com.peopleground.sagwim.content.domain.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContentRepository {

    Content save(Content content);

    Optional<Content> findById(Long id);

    Optional<Content> findByIdIncludingDeleted(Long id);

    Page<Content> findAllContents(Pageable pageable);

    /**
     * groupId가 null인 게시글(전체 피드 전용) 목록만 반환한다.
     */
    Page<Content> findAllContentsWithoutGroup(Pageable pageable);

    /**
     * 특정 모임에 속한 게시글 목록을 반환한다.
     */
    Page<Content> findAllByGroupId(Long groupId, Pageable pageable);

    Page<Content> findAllContentsIncludingDeleted(Pageable pageable);

    Page<Content> findAllByUsername(String username, Pageable pageable);

    Page<Content> searchContents(String keyword, SearchType searchType, Pageable pageable);

    Page<Content> searchContentsIncludingDeleted(String keyword, SearchType searchType, Pageable pageable);

    Page<Content> findAllByTagName(String tagName, Pageable pageable);

    List<Content> findAllByIds(List<Long> ids);

    Map<String, Long> countMonthlyCreations(LocalDateTime windowStart);

    /**
     * likeCount 를 원자적으로 1 증가시킨다. (DB 레벨 Lost Update 방지용)
     */
    int incrementLikeCount(Long id);

    /**
     * likeCount 를 원자적으로 1 감소시킨다. (0 미만 방지)
     */
    int decrementLikeCount(Long id);

    /**
     * 원자 UPDATE 직후 최신 likeCount 만 가볍게 재조회한다. 존재하지 않으면 null 반환.
     */
    Integer findLikeCountById(Long id);

    /**
     * commentCount 원자적 1 증가 (댓글 작성 시 Lost Update 방지).
     */
    int incrementCommentCount(Long id);

    /**
     * commentCount 원자적 1 감소 (0 미만 방지).
     */
    int decrementCommentCount(Long id);
}
