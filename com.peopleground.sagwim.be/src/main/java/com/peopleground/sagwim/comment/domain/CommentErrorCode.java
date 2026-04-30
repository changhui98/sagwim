package com.peopleground.sagwim.comment.domain;

import com.peopleground.sagwim.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum CommentErrorCode implements ErrorCode {

    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "CM001", "존재하지 않는 댓글입니다."),
    COMMENT_FORBIDDEN(HttpStatus.FORBIDDEN, "CM002", "댓글을 수정/삭제할 권한이 없습니다."),
    COMMENT_ALREADY_DELETED(HttpStatus.BAD_REQUEST, "CM003", "이미 삭제된 댓글입니다."),
    COMMENT_REPLY_NOT_ALLOWED(HttpStatus.BAD_REQUEST, "CM004", "대댓글에는 답글을 달 수 없습니다.")
    ;

    private final HttpStatus status;
    private final String code;
    private final String message;
}
