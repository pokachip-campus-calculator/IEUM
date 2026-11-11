package com.ieum.practice.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.practice.dto.PracticeDetailResponse;
import com.ieum.practice.dto.PracticeDetailResponse.RecordView;
import com.ieum.practice.dto.SaveRecordRequest;
import com.ieum.practice.service.PracticeDetailService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 연습 상세 09 GET /practices/{id}, 진행 저장·마침 10 PUT /practices/{id}/record 요청을 받는다.
 * [동작] 토큰의 사용자 id로 본인 기록만 읽고 쓴다.
 * [연결] 화면 S07·S08·S09 / PracticeDetailService
 * [주의] 실제 주소는 /api/v1/practices/... 이다. 학습자만 쓸 수 있다(이음쌤은 403).
 */
@RestController
@RequestMapping("/practices")
public class PracticeDetailController {

    private final PracticeDetailService detailService;

    public PracticeDetailController(PracticeDetailService detailService) {
        this.detailService = detailService;
    }

    @GetMapping("/{id}")
    public PracticeDetailResponse detail(@AuthenticationPrincipal AuthUser user, @PathVariable long id) {
        return detailService.detail(user.id(), user.role(), id);
    }

    @PutMapping("/{id}/record")
    public RecordView saveRecord(@AuthenticationPrincipal AuthUser user, @PathVariable long id,
                                 @RequestBody SaveRecordRequest request) {
        return detailService.saveRecord(user.id(), user.role(), id, request);
    }
}
