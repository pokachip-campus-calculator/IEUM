package com.ieum.auth.dto;

import com.ieum.user.entity.Role;

import java.time.OffsetDateTime;

/** [역할] 로그인(02) 응답: 토큰, 만료 시각, 로그인한 사용자 요약. */
public record LoginResponse(String token, OffsetDateTime expiresAt, UserSummary user) {

    /** [역할] 응답에 담는 사용자 요약(id·닉네임·역할). */
    public record UserSummary(Long id, String nickname, Role role) {}
}
