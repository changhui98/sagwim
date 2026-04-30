package com.peopleground.sagwim.content.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ContentErrorCode implements ErrorCode {

    CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "C001", "존재하지 않는 게시글입니다."),
    CONTENT_FORBIDDEN(HttpStatus.FORBIDDEN, "C002", "게시글을 수정할 권한이 없습니다."),
    CONTENT_ALREADY_DELETED(HttpStatus.BAD_REQUEST, "C003", "이미 삭제된 게시글입니다."),
    CONTENT_NOT_DELETED(HttpStatus.BAD_REQUEST, "C004", "삭제되지 않은 게시글입니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
