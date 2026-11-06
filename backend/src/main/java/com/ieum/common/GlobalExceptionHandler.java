package com.ieum.common;


import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** comment.
     * [역할] 서버에서 나는 오류를 기준서의 오류 응답 형식으로 바꿔 준다.
     * [연결] 서비스가 던진 ApiException을 여기서 받는다. 코드 목록은 ErrorCode.
     * [주의] 오류 코드가 바뀌면 ErrorCode만 고친다.
 */
// 모든 컨트롤러의 오류를 한곳에서 처리
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ApiException → 오류 코드에 맞는 상태와 JSON으로 응답
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException e) {
        ErrorCode ec = e.getErrorCode();
        return ResponseEntity.status(ec.getStatus())
                .body(new ErrorResponse(ec.name(), ec.getMessage(), e.getFieldErrors()));
    }

    // 입력 검증 실패 → 400과 함께 틀린 항목 목록을 응답
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {

        var fields = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ErrorResponse.FieldError(f.getField(), f.getDefaultMessage()))
                .toList();
        ErrorCode ec = ErrorCode.VALIDATION_FAILED;
        return ResponseEntity.status(ec.getStatus())
                .body(new ErrorResponse(ec.name(), ec.getMessage(), fields));
    }

    // JSON 형식이 깨졌거나 enum 값이 틀린 요청 → 400 VALIDATION_FAILED
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException e) {
        ErrorCode ec = ErrorCode.VALIDATION_FAILED;
        return ResponseEntity.status(ec.getStatus()).body(ErrorResponse.of(ec));
    }

}
