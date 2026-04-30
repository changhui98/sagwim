package com.peopleground.sagwim.schedule.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record ScheduleCreateRequest(

    @NotBlank(message = "일정 제목은 필수입니다.")
    @Size(max = 100, message = "일정 제목은 100자를 초과할 수 없습니다.")
    String title,

    @NotNull(message = "시작 시간은 필수입니다.")
    LocalDateTime startAt,

    @NotNull(message = "종료 시간은 필수입니다.")
    LocalDateTime endAt,

    @Size(max = 200, message = "장소는 200자를 초과할 수 없습니다.")
    String location,

    String description
) {
}
