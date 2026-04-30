package com.peopleground.sagwim.global.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.util.List;

public record ErrorResponse(
    String code,
    String message,
    @JsonInclude(Include.NON_NULL)List<ErrorField> errors
    ) {

    public static ErrorResponse from(AppException appException) {
        return new ErrorResponse(appException.getErrorcode().toString(), appException.getMessage(), null);
    }

    public static ErrorResponse from(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), null);
    }

    public static ErrorResponse of(ErrorCode errorCode, List<ErrorField> errors) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage(), errors);
    }

    public record ErrorField(Object value, String message){}
}
