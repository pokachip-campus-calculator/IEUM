package com.ieum.user.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.user.dto.ChangePasswordRequest;
import com.ieum.user.dto.MeResponse;
import com.ieum.user.dto.UpdateMeRequest;
import com.ieum.user.dto.WithdrawRequest;
import com.ieum.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 내 정보 03 GET /me, 04 PATCH /me, 05 PUT /me/password, 06 POST /me/withdraw 요청을 받는다.
 * [동작] 토큰에서 꺼낸 로그인 사용자 id만 서비스에 넘기므로 남의 정보는 건드릴 수 없다.
 * [연결] 화면 S14와 공통 헤더 / UserService
 * [주의] 실제 주소는 /api/v1/me... 이다. 모두 로그인이 필요하다(탈퇴는 학습자만).
 */
@RestController
@RequestMapping("/me")
public class MeController {

    private final UserService userService;

    public MeController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public MeResponse me(@AuthenticationPrincipal AuthUser user) {
        return userService.getMe(user.id());
    }

    @PatchMapping
    public MeResponse update(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody UpdateMeRequest request) {
        return userService.updateMe(user.id(), request);
    }

    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(user.id(), request);
    }

    @PostMapping("/withdraw")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody WithdrawRequest request) {
        userService.withdraw(user.id());
    }
}
