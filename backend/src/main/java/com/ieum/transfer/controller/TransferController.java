package com.ieum.transfer.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.transfer.dto.TransferCreateRequest;
import com.ieum.transfer.dto.TransferCreateResponse;
import com.ieum.transfer.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 25 POST /teacher/students/{studentId}/transfer-requests, 26 POST /teacher/transfer-requests/{id}/accept를 받는다.
 * [동작] 토큰의 사용자 id를 이음쌤 id로 써서 TransferService에 넘긴다.
 * [연결] 이음쌤 학습자 상세의 "이관 신청" 버튼, 알림 화면의 "수락" 버튼 / TransferService
 * [주의] /teacher/**는 SecurityConfig가 이음쌤만 통과시켜서 여기서 역할을 다시 확인하지 않는다.
 */
@RestController
@RequestMapping("/teacher")
public class TransferController {

    private final TransferService transferService;

    public TransferController(TransferService transferService) {
        this.transferService = transferService;
    }

    @PostMapping("/students/{studentId}/transfer-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public TransferCreateResponse create(@AuthenticationPrincipal AuthUser user, @PathVariable Long studentId,
                                         @Valid @RequestBody TransferCreateRequest request) {
        return transferService.create(user.id(), studentId, request.toLoginId());
    }

    @PostMapping("/transfer-requests/{id}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        transferService.accept(user.id(), id);
    }
}
