package com.peopleground.sagwim.schedule.presentation.dto.response;

import com.peopleground.sagwim.schedule.domain.entity.Schedule;
import java.time.LocalDateTime;

public record ScheduleResponse(
    Long id,
    String title,
    LocalDateTime startAt,
    LocalDateTime endAt,
    String location,
    String description,
    String createdByUsername,
    String createdByNickname
) {

    public static ScheduleResponse from(Schedule schedule) {
        return new ScheduleResponse(
            schedule.getId(),
            schedule.getTitle(),
            schedule.getStartAt(),
            schedule.getEndAt(),
            schedule.getLocation(),
            schedule.getDescription(),
            schedule.getCreatedByUser().getUsername(),
            schedule.getCreatedByUser().getNickname()
        );
    }
}
