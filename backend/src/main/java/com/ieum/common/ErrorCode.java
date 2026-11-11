package com.ieum.common;

import org.springframework.http.HttpStatus;

/**
 * [역할] 서버에서 쓰는 오류 종류와 HTTP 상태, 기본 문구를 한곳에 모아 둔 목록.
 *
 * 응답 형식
 * { "code": "NOT_FOUND", "message": "요청한 정보를 찾을 수 없습니다." }
 *
 * 입력 오류일 때만 `fieldErrors`가 같이 옵니다.
 * { "code": "VALIDATION_FAILED", "message": "...", "fieldErrors": [{ "field": "loginId", "message": "..." }] }
 */

// 오류 코드별 HTTP 상태와 메시지 목록
    /* comment. 오류 코드
        |         code         |         HTTP       |         언제         |
        |----------------------|--------------------|---------------------|
        | VALIDATION_FAILED    | 400 (BAD_REQUEST)  | 입력 형식 오류        |
        | RECORD_INCOMPLETE    | 400 (BAD_REQUEST)  | 필수 선택이 빠짐      |
        | UNAUTHORIZED         | 401 (UNAUTHORIZED) | 토큰 없음·만료·탈퇴 |
        | BAD_CREDENTIALS      | 401 (UNAUTHORIZED) | 아이디·비밀번호 불일치 |
        | GUARDIAN_PENDING     | 403 (FORBIDDEN)    | 보호자 확인 전 로그인 |
        | FORBIDDEN            | 403 (FORBIDDEN)    | 권한 없음           |
        | TEACHER_SIGNUP_CLOSED | 403 (FORBIDDEN)   | 이음쌤 가입 시도      |
        | NOT_FOUND            | 404 (NOT_FOUND)    | 없는 id            |
        | LOGIN_ID_TAKEN       | 409 (CONFLICT)     | 아이디 중복         |
        | NO_TEACHER_AVAILABLE | 409 (CONFLICT)     | 맡을 이음쌤 없음     |
        | METHOD_NOT_ALLOWED   | 405                | 지원하지 않는 요청 방식 |
        | INTERNAL_ERROR       | 500                | 서버 내부 오류        | */


public enum ErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "입력 형식이 올바르지 않습니다."),
    RECORD_INCOMPLETE(HttpStatus.BAD_REQUEST, "필수 선택이 빠졌습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    BAD_CREDENTIALS(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 맞지 않습니다."),
    GUARDIAN_PENDING(HttpStatus.FORBIDDEN, "보호자 확인이 끝나면 시작할 수 있습니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    TEACHER_SIGNUP_CLOSED(HttpStatus.FORBIDDEN, "이음쌤은 기관 확인을 거친 분만 가입할 수 있어요. 가입 문의는 담당자에게 해 주세요."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 정보를 찾을 수 없습니다."),
    LOGIN_ID_TAKEN(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
    NO_TEACHER_AVAILABLE(HttpStatus.CONFLICT, "배정된 이음쌤이 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버에 문제가 생겼습니다. 잠시 뒤 다시 시도해 주세요.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    // 읽기 전용 통로
    public HttpStatus getStatus() { return status; }
    public String getMessage() { return message; }
}
