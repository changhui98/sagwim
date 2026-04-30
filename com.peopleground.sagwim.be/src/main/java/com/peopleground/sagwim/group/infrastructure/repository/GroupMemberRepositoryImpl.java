package com.peopleground.sagwim.group.infrastructure.repository;

import com.peopleground.sagwim.group.domain.entity.GroupMember;
import com.peopleground.sagwim.group.domain.repository.GroupMemberRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class GroupMemberRepositoryImpl implements GroupMemberRepository {

    private final GroupMemberJpaRepository groupMemberJpaRepository;

    @Override
    public GroupMember save(GroupMember groupMember) {
        return groupMemberJpaRepository.save(groupMember);
    }

    @Override
    public Optional<GroupMember> findByGroupIdAndUsername(Long groupId, String username) {
        return groupMemberJpaRepository.findByGroupIdAndUsername(groupId, username);
    }

    @Override
    public List<GroupMember> findByGroupId(Long groupId) {
        return groupMemberJpaRepository.findByGroupId(groupId);
    }

    @Override
    public boolean existsByGroupIdAndUsername(Long groupId, String username) {
        return groupMemberJpaRepository.existsByGroupIdAndUsername(groupId, username);
    }

    @Override
    public void delete(GroupMember groupMember) {
        groupMemberJpaRepository.delete(groupMember);
    }

    @Override
    public void deleteAllByGroupId(Long groupId) {
        groupMemberJpaRepository.deleteAllByGroupId(groupId);
    }
}
