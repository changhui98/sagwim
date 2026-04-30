package com.peopleground.sagwim.tag.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum TagErrorCode implements ErrorCode {

    TAG_NOT_FOUND(HttpStatus.NOT_FOUND, "T001", "존재하지 않는 태그입니다."),
    TAG_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "T002", "태그는 게시글 당 최대 10개까지 추가할 수 있습니다."),
    TAG_NAME_TOO_LONG(HttpStatus.BAD_REQUEST, "T003", "태그 이름은 30자 이하로 입력해주세요.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
