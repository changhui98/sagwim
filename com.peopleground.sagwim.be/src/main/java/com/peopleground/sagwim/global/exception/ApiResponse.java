package com.peopleground.sagwim.global.exception;

public record ApiResponse(
    String errorCode,
    String message
) {

}
