package com.peopleground.sagwim.like.infrastructure.repository;

import com.peopleground.sagwim.like.domain.entity.CommentLike;
import com.peopleground.sagwim.like.domain.repository.CommentLikeRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CommentLikeRepositoryImpl implements CommentLikeRepository {

    private final CommentLikeJpaRepository commentLikeJpaRepository;

    @Override
    public CommentLike save(CommentLike commentLike) {
        return commentLikeJpaRepository.save(commentLike);
    }

    @Override
    public Optional<CommentLike> findByCommentIdAndUserId(Long commentId, UUID userId) {
        return commentLikeJpaRepository.findByCommentIdAndUserId(commentId, userId);
    }

    @Override
    public boolean existsByCommentIdAndUserId(Long commentId, UUID userId) {
        return commentLikeJpaRepository.existsByCommentIdAndUserId(commentId, userId);
    }

    @Override
    public void delete(CommentLike commentLike) {
        commentLikeJpaRepository.delete(commentLike);
    }

    @Override
    public int insertIfNotExists(Long commentId, UUID userId) {
        return commentLikeJpaRepository.insertIfNotExists(commentId, userId);
    }
}
