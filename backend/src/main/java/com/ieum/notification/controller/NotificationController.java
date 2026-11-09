package com.ieum.notification.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.notification.dto.NotificationListResponse;
import com.ieum.notification.dto.ReadAllResponse;
import com.ieum.notification.service.NotificationService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 알림 22 GET /notifications?unread=, 23 PATCH /notifications/{id}/read, 24 PATCH /notifications/read-all 요청을 받는다.
 * [동작] 토큰의 사용자 id만 서비스에 넘기므로 본인 알림만 다룬다. unread는 직접 읽어 true·false 밖의 값이면 오류 형식에 맞춰 돌려준다.
 * [연결] 화면 S15와 사이드 메뉴 배지 / NotificationService
 * [주의] 실제 주소는 /api/v1/notifications 이고 학습자·이음쌤이 같이 쓴다. mock.learning.enabled=false일 때만 켜진다(기본은 NotificationMockController).
 */
@RestController
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "false")
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationListResponse list(@AuthenticationPrincipal AuthUser user,
                                         @RequestParam(required = false) String unread) {
        return notificationService.list(user.id(), parseUnread(unread));
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        notificationService.markRead(user.id(), id);
    }

    @PatchMapping("/read-all")
    public ReadAllResponse readAll(@AuthenticationPrincipal AuthUser user) {
        return notificationService.markAllRead(user.id());
    }

    // 생략하면 전체. true·false 밖의 값은 VALIDATION_FAILED(unread)
    private boolean parseUnread(String unread) {
        if (unread == null || unread.isEmpty() || "false".equals(unread)) {
            return false;
        }
        if ("true".equals(unread)) {
            return true;
        }
        throw ApiException.invalid("unread", "unread는 true 또는 false만 쓸 수 있어요.");
    }
}
