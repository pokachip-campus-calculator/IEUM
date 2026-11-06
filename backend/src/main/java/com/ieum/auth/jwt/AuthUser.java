package com.ieum.auth.jwt;

import com.ieum.user.entity.Role;

/** [역할] 토큰에서 꺼낸 로그인 사용자(id·role). 컨트롤러에서 @AuthenticationPrincipal로 받는다. */
public record AuthUser(Long id, Role role) {
}
