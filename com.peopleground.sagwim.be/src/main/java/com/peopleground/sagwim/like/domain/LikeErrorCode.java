package com.peopleground.sagwim.like.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum LikeErrorCode implements ErrorCode {

    CONTENT_LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "L001", "게시글 좋아요 정보를 찾을 수 없습니다."),
    COMMENT_LIKE_NOT_FOUND(HttpStatus.NOT_FOUND, "L002", "댓글 좋아요 정보를 찾을 수 없습니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
