package com.peopleground.sagwim.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ApiErrorCode implements ErrorCode {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "A001", "잘못된 요청입니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "A002", "접근 권한이 없습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "A003", "인증이 필요합니다."),
    ADDRESS_CONVERT_FAILED(HttpStatus.BAD_REQUEST, "A004", "주소 변환에 실패했습니다."),
    ADDRESS_NOT_FOUNT(HttpStatus.BAD_REQUEST, "A005", "유효한 주소를 찾을 수 없습니다."),
    EXTERNAL_API_ERROR(HttpStatus.BAD_GATEWAY, "A006", "외부 주소 변환 서비스 호출에 실패했습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "A999", "서버 내부 오류가 발생했습니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;

}
