package com.ieum.common;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

/** comment.
     * [역할] 서버에서 나는 오류를 기준서의 오류 응답 형식으로 바꿔 준다.
     * [연결] 서비스가 던진 ApiException을 여기서 받는다. 코드 목록은 ErrorCode.
     * [주의] 오류 코드가 바뀌면 ErrorCode만 고친다.
 */
// 모든 컨트롤러의 오류를 한곳에서 처리
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

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

    // 주소의 id 자리에 숫자가 아닌 값(예: /threads/abc)이 온 경우 → 400 VALIDATION_FAILED, 틀린 항목 이름을 함께 응답
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        ErrorCode ec = ErrorCode.VALIDATION_FAILED;
        var field = new ErrorResponse.FieldError(e.getName(), "올바른 값이 아닙니다.");
        return ResponseEntity.status(ec.getStatus()).body(new ErrorResponse(ec.name(), ec.getMessage(), List.of(field)));
    }

    // 없는 주소 → 404 NOT_FOUND
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e) {
        ErrorCode ec = ErrorCode.NOT_FOUND;
        return ResponseEntity.status(ec.getStatus()).body(ErrorResponse.of(ec));
    }

    // 주소는 맞지만 허용하지 않는 메서드(예: GET 전용 주소에 POST) → 405 METHOD_NOT_ALLOWED
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        ErrorCode ec = ErrorCode.METHOD_NOT_ALLOWED;
        return ResponseEntity.status(ec.getStatus()).body(ErrorResponse.of(ec));
    }

    // 그 밖의 예외. Spring이 4xx로 정한 것(파라미터 누락, 지원하지 않는 본문 형식 등)은 그 상태를 지키고,
    // 나머지는 원인을 로그에만 남기고 500 INTERNAL_ERROR로 응답한다(예외 내용은 응답에 넣지 않는다)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        if (e instanceof org.springframework.web.ErrorResponse spring && spring.getStatusCode().is4xxClientError()) {
            return ResponseEntity.status(spring.getStatusCode()).body(ErrorResponse.of(ErrorCode.VALIDATION_FAILED));
        }
        log.error("처리하지 못한 오류", e);
        ErrorCode ec = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity.status(ec.getStatus()).body(ErrorResponse.of(ec));
    }

}
