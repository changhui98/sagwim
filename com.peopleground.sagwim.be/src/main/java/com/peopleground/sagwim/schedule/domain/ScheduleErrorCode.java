package com.peopleground.sagwim.schedule.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ScheduleErrorCode implements ErrorCode {

    SCHEDULE_NOT_MEMBER(HttpStatus.FORBIDDEN, "S001", "모임 멤버만 일정을 등록할 수 있습니다."),
    SCHEDULE_INVALID_DATE(HttpStatus.BAD_REQUEST, "S002", "종료 시간은 시작 시간보다 이후여야 합니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
