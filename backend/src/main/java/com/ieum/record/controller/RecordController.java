package com.ieum.record.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.record.dto.RecordListResponse;
import com.ieum.record.service.RecordService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 학습 기록 11 GET /records?status=&sort= 요청을 받는다.
 * [동작] status(DONE·IN_PROGRESS, 생략=모두)와 sort(recent 기본·old)는 선택 조건이고, 토큰의 사용자 id로 본인 기록만 읽는다.
 * [연결] 화면 S10 / RecordService
 * [주의] 실제 주소는 /api/v1/records 이다. 학습자만 쓸 수 있고(이음쌤은 403), 잘못된 status·sort 값은 400 VALIDATION_FAILED다.
 *        mock.learning.enabled=false일 때만 켜진다(기본은 PracticeMockController).
 */
@RestController
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "false")
@RequestMapping("/records")
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping
    public RecordListResponse list(@AuthenticationPrincipal AuthUser user,
                                   @RequestParam(required = false) String status,
                                   @RequestParam(required = false) String sort) {
        return recordService.list(user.id(), user.role(), status, sort);
    }
}
