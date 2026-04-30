package com.peopleground.sagwim.group.presentation.dto.response;

import com.peopleground.sagwim.group.domain.entity.GroupMember;
import com.peopleground.sagwim.group.domain.entity.GroupMemberRole;
import java.time.LocalDateTime;

public record GroupMemberResponse(
    String userId,
    String nickname,
    String username,
    GroupMemberRole role,
    LocalDateTime joinedAt
) {

    public static GroupMemberResponse from(GroupMember groupMember) {
        return new GroupMemberResponse(
            groupMember.getUser().getId().toString(),
            groupMember.getUser().getNickname(),
            groupMember.getUser().getUsername(),
            groupMember.getRole(),
            groupMember.getCreatedDate()
        );
    }
}
