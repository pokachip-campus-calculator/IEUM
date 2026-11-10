package com.ieum.auth.dto;

import com.ieum.user.entity.UserStatus;

/** [역할] 회원가입(01) 응답. ACTIVE 또는 PENDING_GUARDIAN(보호자 확인 대기). */
public record SignupResponse(UserStatus status) {
}
