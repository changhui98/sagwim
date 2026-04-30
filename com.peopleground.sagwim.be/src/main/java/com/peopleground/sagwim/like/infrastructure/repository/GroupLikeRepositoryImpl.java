package com.peopleground.sagwim.like.infrastructure.repository;

import com.peopleground.sagwim.like.domain.entity.GroupLike;
import com.peopleground.sagwim.like.domain.repository.GroupLikeRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GroupLikeRepositoryImpl implements GroupLikeRepository {

    private final GroupLikeJpaRepository groupLikeJpaRepository;

    @Override
    public GroupLike save(GroupLike groupLike) {
        return groupLikeJpaRepository.save(groupLike);
    }

    @Override
    public Optional<GroupLike> findByGroupIdAndUserId(Long groupId, UUID userId) {
        return groupLikeJpaRepository.findByGroupIdAndUserId(groupId, userId);
    }

    @Override
    public boolean existsByGroupIdAndUserId(Long groupId, UUID userId) {
        return groupLikeJpaRepository.existsByGroupIdAndUserId(groupId, userId);
    }

    @Override
    public void delete(GroupLike groupLike) {
        groupLikeJpaRepository.delete(groupLike);
    }

    @Override
    public int insertIfNotExists(Long groupId, UUID userId) {
        return groupLikeJpaRepository.insertIfNotExists(groupId, userId);
    }

    @Override
    public List<GroupLike> findByGroupId(Long groupId) {
        return groupLikeJpaRepository.findByGroupId(groupId);
    }
}
