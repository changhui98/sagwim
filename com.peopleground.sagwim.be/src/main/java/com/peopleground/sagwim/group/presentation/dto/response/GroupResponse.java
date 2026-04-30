package com.peopleground.sagwim.group.presentation.dto.response;

import com.peopleground.sagwim.group.domain.entity.Group;
import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import java.time.LocalDateTime;

public record GroupResponse(
    Long id,
    String name,
    String description,
    GroupCategory category,
    GroupMeetingType meetingType,
    String region,
    int maxMemberCount,
    int currentMemberCount,
    String leaderNickname,
    String leaderUsername,
    LocalDateTime createdDate,
    String imageUrl,
    int likeCount
) {

    public static GroupResponse from(Group group) {
        return new GroupResponse(
            group.getId(),
            group.getName(),
            group.getDescription(),
            group.getCategory(),
            group.getMeetingType(),
            group.getRegion(),
            group.getMaxMemberCount(),
            group.getCurrentMemberCount(),
            group.getLeader().getNickname(),
            group.getLeader().getUsername(),
            group.getCreatedDate(),
            group.getImageUrl(),
            group.getLikeCount()
        );
    }
}
