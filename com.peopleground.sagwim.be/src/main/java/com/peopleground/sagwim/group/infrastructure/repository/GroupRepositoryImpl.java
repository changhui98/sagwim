package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.repository.GroupRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GroupRepositoryImpl implements GroupRepository {

    private final GroupJpaRepository groupJpaRepository;
    private final GroupQueryRepository groupQueryRepository;

    @Override
    public Group save(Group group) {
        return groupJpaRepository.save(group);
    }

    @Override
    public Optional<Group> findById(Long id) {
        return groupQueryRepository.findById(id);
    }

    @Override
    public Page<Group> findAll(Pageable pageable, String keyword, GroupCategory category) {
        return groupQueryRepository.findAll(pageable, keyword, category);
    }

    @Override
    public Page<Group> findNewGroups(Pageable pageable) {
        return groupQueryRepository.findNewGroups(pageable);
    }

    @Override
    public Page<Group> findPopularGroups(Pageable pageable) {
        return groupQueryRepository.findPopularGroups(pageable);
    }

    @Override
    public Page<Group> findByMemberUsername(String username, Pageable pageable) {
        return groupQueryRepository.findByMemberUsername(username, pageable);
    }

    @Override
    public void incrementMemberCount(Long groupId) {
        groupJpaRepository.incrementMemberCount(groupId);
    }

    @Override
    public void decrementMemberCount(Long groupId) {
        groupJpaRepository.decrementMemberCount(groupId);
    }

    @Override
    public void incrementLikeCount(Long groupId) {
        groupJpaRepository.incrementLikeCount(groupId);
    }

    @Override
    public void decrementLikeCount(Long groupId) {
        groupJpaRepository.decrementLikeCount(groupId);
    }

    @Override
    public Integer findLikeCountById(Long groupId) {
        return groupJpaRepository.findLikeCountById(groupId);
    }
}
