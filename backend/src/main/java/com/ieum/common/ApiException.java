package com.ieum.common;

// 서비스 코드에서 던지는 오류 신호: throw new ApiException(ErrorCode.XXX)
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() { return errorCode; }

}
