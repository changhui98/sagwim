package com.peopleground.sagwim.group.domain.repository;

import com.peopleground.sagwim.group.domain.entity.GroupMember;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository {

    GroupMember save(GroupMember groupMember);

    Optional<GroupMember> findByGroupIdAndUsername(Long groupId, String username);

    List<GroupMember> findByGroupId(Long groupId);

    boolean existsByGroupIdAndUsername(Long groupId, String username);

    void delete(GroupMember groupMember);

    void deleteAllByGroupId(Long groupId);
}
