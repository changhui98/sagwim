package com.peopleground.sagwim.group.presentation.dto.request;

import com.peopleground.sagwim.group.domain.entity.GroupCategory;
import com.peopleground.sagwim.group.domain.entity.GroupMeetingType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GroupCreateRequest(

    @NotBlank(message = "모임 이름은 필수입니다.")
    @Size(max = 50, message = "모임 이름은 50자를 초과할 수 없습니다.")
    String name,

    @Size(max = 1000, message = "설명은 1000자를 초과할 수 없습니다.")
    String description,

    @NotNull(message = "카테고리는 필수입니다.")
    GroupCategory category,

    @NotNull(message = "모임 방식은 필수입니다.")
    GroupMeetingType meetingType,

    @Size(max = 50, message = "지역은 50자를 초과할 수 없습니다.")
    String region,

    @NotNull(message = "최대 인원은 필수입니다.")
    @Min(value = 2, message = "최대 인원은 2명 이상이어야 합니다.")
    @Max(value = 100, message = "최대 인원은 100명을 초과할 수 없습니다.")
    Integer maxMemberCount
) {
}
