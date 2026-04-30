package com.peopleground.sagwim.like.infrastructure.repository;

import com.peopleground.sagwim.like.domain.entity.ContentLike;
import com.peopleground.sagwim.like.domain.repository.ContentLikeRepository;
import java.util.Collection;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ContentLikeRepositoryImpl implements ContentLikeRepository {

    private final ContentLikeJpaRepository contentLikeJpaRepository;

    @Override
    public ContentLike save(ContentLike contentLike) {
        return contentLikeJpaRepository.save(contentLike);
    }

    @Override
    public Optional<ContentLike> findByContentIdAndUserId(Long contentId, UUID userId) {
        return contentLikeJpaRepository.findByContentIdAndUserId(contentId, userId);
    }

    @Override
    public boolean existsByContentIdAndUserId(Long contentId, UUID userId) {
        return contentLikeJpaRepository.existsByContentIdAndUserId(contentId, userId);
    }

    @Override
    public void delete(ContentLike contentLike) {
        contentLikeJpaRepository.delete(contentLike);
    }

    @Override
    public int insertIfNotExists(Long contentId, UUID userId) {
        return contentLikeJpaRepository.insertIfNotExists(contentId, userId);
    }

    @Override
    public Set<Long> findLikedContentIds(UUID userId, Collection<Long> contentIds) {
        if (userId == null || contentIds == null || contentIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(contentLikeJpaRepository.findLikedContentIds(userId, contentIds));
    }
}
