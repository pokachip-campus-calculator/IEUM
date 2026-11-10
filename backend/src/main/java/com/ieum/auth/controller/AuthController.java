package com.ieum.auth.controller;

import com.ieum.auth.dto.LoginRequest;
import com.ieum.auth.dto.LoginResponse;
import com.ieum.auth.dto.SignupRequest;
import com.ieum.auth.dto.SignupResponse;
import com.ieum.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 회원가입 01 POST /auth/signup, 로그인 02 POST /auth/login 요청을 받는다.
 * [동작] 요청 형식을 검사한 뒤 AuthService에 넘기고 결과를 그대로 응답한다.
 * [연결] 화면 S03(가입)·S02(로그인) / AuthService
 * [주의] 실제 주소는 /api/v1/auth/... 이다(기본 경로는 ApiPathConfig가 붙인다). /auth/**는 로그인 없이 열려 있다.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public SignupResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
