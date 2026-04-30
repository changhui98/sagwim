package com.peopleground.sagwim.content.infrastructure.repository;

import com.peopleground.sagwim.content.domain.entity.Content;
import com.peopleground.sagwim.content.domain.repository.ContentRepository;
import com.peopleground.sagwim.content.presentation.dto.request.SearchType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ContentRepositoryImpl implements ContentRepository {

    private final ContentJpaRepository contentJpaRepository;
    private final ContentQueryRepository contentQueryRepository;

    @Override
    public Content save(Content content) {

        return contentJpaRepository.save(content);
    }

    @Override
    public Optional<Content> findById(Long id) {

        return contentQueryRepository.findById(id);
    }

    @Override
    public Optional<Content> findByIdIncludingDeleted(Long id) {

        return contentQueryRepository.findByIdIncludingDeleted(id);
    }

    @Override
    public Page<Content> findAllContents(Pageable pageable) {

        return contentQueryRepository.findAllContents(pageable);
    }

    @Override
    public Page<Content> findAllContentsWithoutGroup(Pageable pageable) {

        return contentQueryRepository.findAllContentsWithoutGroup(pageable);
    }

    @Override
    public Page<Content> findAllByGroupId(Long groupId, Pageable pageable) {

        return contentQueryRepository.findAllByGroupId(groupId, pageable);
    }

    @Override
    public Page<Content> findAllContentsIncludingDeleted(Pageable pageable) {

        return contentQueryRepository.findAllContentsIncludingDeleted(pageable);
    }

    @Override
    public Page<Content> findAllByUsername(String username, Pageable pageable) {

        return contentQueryRepository.findAllByUsername(username, pageable);
    }

    @Override
    public Page<Content> searchContents(String keyword, SearchType searchType, Pageable pageable) {

        return contentQueryRepository.searchContents(keyword, searchType, pageable);
    }

    @Override
    public Page<Content> searchContentsIncludingDeleted(String keyword, SearchType searchType, Pageable pageable) {

        return contentQueryRepository.searchContentsIncludingDeleted(keyword, searchType, pageable);
    }

    @Override
    public Page<Content> findAllByTagName(String tagName, Pageable pageable) {

        return contentQueryRepository.findAllByTagName(tagName, pageable);
    }

    @Override
    public List<Content> findAllByIds(List<Long> ids) {
        return contentJpaRepository.findAllById(ids);
    }

    @Override
    public Map<String, Long> countMonthlyCreations(LocalDateTime windowStart) {

        return contentQueryRepository.countMonthlyCreations(windowStart);
    }

    @Override
    public int incrementLikeCount(Long id) {
        return contentJpaRepository.incrementLikeCount(id);
    }

    @Override
    public int decrementLikeCount(Long id) {
        return contentJpaRepository.decrementLikeCount(id);
    }

    @Override
    public Integer findLikeCountById(Long id) {
        return contentJpaRepository.findLikeCountById(id);
    }

    @Override
    public int incrementCommentCount(Long id) {
        return contentJpaRepository.incrementCommentCount(id);
    }

    @Override
    public int decrementCommentCount(Long id) {
        return contentJpaRepository.decrementCommentCount(id);
    }
}
