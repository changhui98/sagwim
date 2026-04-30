package com.peopleground.sagwim.user.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum UserErrorCode implements ErrorCode {

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "조회하려는 사용자가 존재하지 않습니다."),
    DUPLICATE_USERNAME(HttpStatus.CONFLICT, "U002", "이미 존재하는 아이디입니다."),
    MEMBER_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "U003", "인증되지 않은 사용자입니다."),
    INVALID_CREDENTIALS(HttpStatus.BAD_REQUEST, "U004", "아이디 또는 비밀번호가 올바르지 않습니다."),
    INVALID_CURRENT_PASSWORD(HttpStatus.BAD_REQUEST, "U005", "현재 비밀번호가 일치하지 않습니다."),
    PASSWORD_REQUIRED(HttpStatus.BAD_REQUEST, "U006", "현재 비밀번호를 입력해주세요."),
    EMAIL_NOT_VERIFIED(HttpStatus.UNAUTHORIZED, "U007", "이메일 인증이 필요합니다."),
    INVALID_VERIFICATION_CODE(HttpStatus.BAD_REQUEST, "U008", "인증 코드가 올바르지 않거나 만료되었습니다."),
    VERIFICATION_CODE_RESEND_TOO_SOON(HttpStatus.TOO_MANY_REQUESTS, "U009", "인증 코드 재발송은 1분 후에 가능합니다."),
    EMAIL_ALREADY_VERIFIED(HttpStatus.BAD_REQUEST, "U010", "이미 인증된 이메일입니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "U011", "이미 사용 중인 이메일입니다."),
    EMAIL_NOT_PRE_VERIFIED(HttpStatus.BAD_REQUEST, "U012", "이메일 사전 인증이 완료되지 않았습니다."),
    SOCIAL_USER_CANNOT_CHANGE_PASSWORD(HttpStatus.BAD_REQUEST, "U013", "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
