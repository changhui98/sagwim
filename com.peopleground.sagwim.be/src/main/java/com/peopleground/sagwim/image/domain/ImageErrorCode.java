package com.peopleground.sagwim.image.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ImageErrorCode implements ErrorCode {

    IMAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "IMG001", "존재하지 않는 이미지입니다."),
    IMAGE_INVALID_TYPE(HttpStatus.BAD_REQUEST, "IMG002", "허용되지 않는 이미지 형식입니다."),
    IMAGE_TOO_LARGE(HttpStatus.BAD_REQUEST, "IMG003", "이미지 파일 크기가 5MB를 초과합니다."),
    IMAGE_UPLOAD_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "IMG004", "이미지 업로드에 실패했습니다."),
    IMAGE_FORBIDDEN(HttpStatus.FORBIDDEN, "IMG005", "이미지에 대한 권한이 없습니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
