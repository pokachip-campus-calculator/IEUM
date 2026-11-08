package com.ieum.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** [역할] 로그인(02) 요청 본문. */
public record LoginRequest(
        @NotBlank(message = "아이디를 입력해 주세요.") String loginId,
        @NotBlank(message = "비밀번호를 입력해 주세요.") String password
) {
}
