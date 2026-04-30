package com.peopleground.sagwim.global.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 전역 예외 처리기.
 *
 * <p>원칙</p>
 * <ul>
 *     <li>{@link AppException} 은 예상된 비즈니스 예외이므로 WARN 레벨로 요약만 로깅한다.</li>
 *     <li>인증/인가/검증 예외는 INFO 레벨로 요청 경로와 함께 로깅한다.</li>
 *     <li>그 외 모든 {@link Exception} 은 ERROR 레벨로 스택트레이스까지 로깅한다.
 *     (과거 handler 가 stacktrace 없이 삼키는 바람에 QueryDSL/Hibernate 계층에서 발생한
 *     {@code SyntaxException} 원인 분석이 불가능했던 사례가 있었다.)</li>
 * </ul>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException e, HttpServletRequest request) {

        ErrorCode errorCode = e.getErrorcode();
        log.warn("[AppException] {} {} -> code={}, status={}, message={}",
            request.getMethod(), request.getRequestURI(),
            errorCode.getCode(), errorCode.getStatus(), errorCode.getMessage());

        return ResponseEntity
            .status(errorCode.getStatus())
            .body(ErrorResponse.from(errorCode));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
        MethodArgumentNotValidException e, HttpServletRequest request
    ) {

        String message = e.getBindingResult()
            .getFieldErrors()
            .get(0)
            .getDefaultMessage();

        log.info("[Validation] {} {} -> {}",
            request.getMethod(), request.getRequestURI(), message);

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("VALIDATION_ERROR", message, null));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
        AccessDeniedException e, HttpServletRequest request
    ) {

        log.info("[AccessDenied] {} {} -> {}",
            request.getMethod(), request.getRequestURI(), e.getMessage());

        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.from(ApiErrorCode.FORBIDDEN));
    }

    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAuthorizationDeniedException(
        AuthorizationDeniedException e, HttpServletRequest request
    ) {

        log.info("[AuthorizationDenied] {} {} -> {}",
            request.getMethod(), request.getRequestURI(), e.getMessage());

        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.from(ApiErrorCode.FORBIDDEN));
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccessException(
        DataAccessException e, HttpServletRequest request
    ) {

        log.error("[DataAccess] {} {} -> {}",
            request.getMethod(), request.getRequestURI(), e.getMessage(), e);

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.from(ApiErrorCode.INTERNAL_SERVER_ERROR));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e, HttpServletRequest request) {

        log.error("[Unhandled] {} {} -> {}",
            request.getMethod(), request.getRequestURI(), e.getMessage(), e);

        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.from(ApiErrorCode.INTERNAL_SERVER_ERROR));
    }
}
