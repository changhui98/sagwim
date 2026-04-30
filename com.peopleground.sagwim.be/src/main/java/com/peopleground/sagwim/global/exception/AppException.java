package com.peopleground.sagwim.global.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorcode;

    public AppException(ErrorCode errorcode) {
        super(errorcode.getMessage());
        this.errorcode = errorcode;
    }

}
