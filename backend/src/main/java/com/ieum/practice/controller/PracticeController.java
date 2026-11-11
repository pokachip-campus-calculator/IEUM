package com.ieum.practice.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.practice.dto.PracticeListResponse;
import com.ieum.practice.service.PracticeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 연습 목록 08 GET /practices?area=&level=&q= 요청을 받는다.
 * [동작] area·level·q는 모두 선택 조건이다. 로그인한 사용자 id로 내 진행 상태(myStatus)를 붙인다.
 * [연결] 화면 S06 / PracticeService
 * [주의] 실제 주소는 /api/v1/practices 이다. 학습자만 쓸 수 있고(이음쌤은 403), 잘못된 area·level 값은 400 VALIDATION_FAILED다.
 */
@RestController
@RequestMapping("/practices")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @GetMapping
    public PracticeListResponse list(@AuthenticationPrincipal AuthUser user,
                                     @RequestParam(required = false) String area,
                                     @RequestParam(required = false) String level,
                                     @RequestParam(required = false) String q) {
        return practiceService.list(user.id(), user.role(), area, level, q);
    }
}
