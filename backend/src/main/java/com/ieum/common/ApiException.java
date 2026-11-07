package com.ieum.common;

import java.util.List;

/**
 * [역할] 서비스 코드에서 던지는 오류 신호: throw new ApiException(ErrorCode.XXX)
 * [동작] 오류 코드를 담고, 입력 오류일 때는 틀린 항목 목록(fieldErrors)도 함께 담을 수 있다.
 * [연결] GlobalExceptionHandler가 받아서 오류 응답으로 바꾼다 / ErrorCode, ErrorResponse
 * [주의] fieldErrors는 VALIDATION_FAILED일 때만 쓴다. 없으면 null이라 응답에서 빠진다.
 */
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final List<ErrorResponse.FieldError> fieldErrors;

    // 필드 정보가 없는 오류
    public ApiException(ErrorCode errorCode) {
        this(errorCode, null);
    }

    // 필드 정보가 있는 오류
    public ApiException(ErrorCode errorCode, List<ErrorResponse.FieldError> fieldErrors) {
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors;
    }

    // 입력 오류 하나를 한 번에 만든다: throw ApiException.invalid("birthDate", "생년월일을 입력해 주세요.")
    public static ApiException invalid(String field, String message) {
        return new ApiException(ErrorCode.VALIDATION_FAILED, List.of(new ErrorResponse.FieldError(field, message)));
    }

    public ErrorCode getErrorCode() { return errorCode; }
    public List<ErrorResponse.FieldError> getFieldErrors() { return fieldErrors; }

}
