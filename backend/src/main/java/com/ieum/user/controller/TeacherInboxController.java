package com.ieum.user.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.user.dto.HandleSignalRequest;
import com.ieum.user.dto.TeacherSignalListResponse;
import com.ieum.user.dto.TeacherThreadListResponse;
import com.ieum.user.service.TeacherInboxService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 이음쌤 19 GET /teacher/threads, 20 GET /teacher/signals, 21 PATCH /teacher/signals/{id}를 받는다.
 * [동작] 토큰의 사용자 id를 이음쌤 id로 써서 TeacherInboxService에 그대로 넘긴다.
 * [연결] 화면 T02·T03 / TeacherInboxService
 * [주의] /teacher/**는 SecurityConfig가 이음쌤만 통과시켜서 여기서 역할을 다시 확인하지 않는다. 실제 주소는 /api/v1/teacher/... 이다.
 */
@RestController
@RequestMapping("/teacher")
public class TeacherInboxController {

    private final TeacherInboxService teacherInboxService;

    public TeacherInboxController(TeacherInboxService teacherInboxService) {
        this.teacherInboxService = teacherInboxService;
    }

    @GetMapping("/threads")
    public TeacherThreadListResponse threads(@AuthenticationPrincipal AuthUser user,
                                             @RequestParam(required = false) String status) {
        return teacherInboxService.threads(user.id(), status);
    }

    @GetMapping("/signals")
    public TeacherSignalListResponse signals(@AuthenticationPrincipal AuthUser user,
                                             @RequestParam(required = false) String status) {
        return teacherInboxService.signals(user.id(), status);
    }

    @PatchMapping("/signals/{id}")
    public TeacherSignalListResponse.Item handle(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
                                                 @Valid @RequestBody HandleSignalRequest request) {
        return teacherInboxService.handle(user.id(), id, request);
    }
}
