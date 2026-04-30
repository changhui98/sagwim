package com.peopleground.sagwim.group.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum GroupErrorCode implements ErrorCode {

    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "G001", "존재하지 않는 모임입니다."),
    GROUP_FORBIDDEN(HttpStatus.FORBIDDEN, "G002", "모임을 수정/삭제할 권한이 없습니다."),
    GROUP_FULL(HttpStatus.CONFLICT, "G003", "모임 정원이 가득 찼습니다."),
    GROUP_ALREADY_JOINED(HttpStatus.CONFLICT, "G004", "이미 가입된 모임입니다."),
    GROUP_NOT_MEMBER(HttpStatus.BAD_REQUEST, "G005", "해당 모임의 멤버가 아닙니다."),
    GROUP_LEADER_CANNOT_LEAVE(HttpStatus.BAD_REQUEST, "G006", "모임장은 탈퇴할 수 없습니다. 모임을 삭제하거나 다른 멤버에게 권한을 위임하세요."),
    GROUP_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "G007", "해당 모임 멤버를 찾을 수 없습니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
