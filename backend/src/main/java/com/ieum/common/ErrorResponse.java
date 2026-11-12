package com.ieum.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

// 오류 시 프런트에 보내는 JSON 모양 (fieldErrors는 입력 오류일 때만 포함)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String code, String message, List<FieldError> fieldErrors) {

    // 입력 오류가 난 항목 하나 (어느 필드가, 왜)
    public record FieldError(String field, String message) {}

    // ErrorCode 하나로 응답 만들기
    public static ErrorResponse of (ErrorCode e) {
        return new ErrorResponse(e.name(), e.getMessage(), null);
    }
}
