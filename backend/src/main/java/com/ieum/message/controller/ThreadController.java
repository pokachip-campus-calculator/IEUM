package com.ieum.message.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.message.dto.CreateThreadRequest;
import com.ieum.message.dto.CreateThreadResponse;
import com.ieum.message.dto.ThreadListResponse;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.service.ThreadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 쪽지 12 POST /threads(보내기), 13 GET /threads?status=(내 쪽지함) 요청을 받는다.
 * [동작] 토큰의 사용자 id만 서비스에 넘기므로 남의 쪽지함은 볼 수 없다. status는 직접 읽어 틀린 값이면 오류 형식에 맞춰 돌려준다.
 * [연결] 화면 S11·S12 / ThreadService
 * [주의] 실제 주소는 /api/v1/threads 이다. 학습자만 쓸 수 있고 이음쌤이 부르면 서비스가 FORBIDDEN을 낸다.
 */
@RestController
@RequestMapping("/threads")
public class ThreadController {

    private final ThreadService threadService;

    public ThreadController(ThreadService threadService) {
        this.threadService = threadService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateThreadResponse create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody CreateThreadRequest request) {
        return threadService.create(user.id(), request);
    }

    @GetMapping
    public ThreadListResponse list(@AuthenticationPrincipal AuthUser user,
                                   @RequestParam(required = false) String status) {
        return threadService.list(user.id(), parseStatus(status));
    }

    // 생략하면 모두. WAITING·ANSWERED 밖의 값은 VALIDATION_FAILED(status)
    private ThreadStatus parseStatus(String status) {
        if (status == null || status.isEmpty()) {
            return null;
        }
        try {
            return ThreadStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("status", "status는 WAITING 또는 ANSWERED만 쓸 수 있어요.");
        }
    }
}
