package com.ieum.notification.controller;

import com.ieum.auth.jwt.AuthUser;
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

@RestController
@RequestMapping("/notifications")
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "false")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationService.NotificationList list(@AuthenticationPrincipal AuthUser user,
                                                     @RequestParam(required = false) String unread) {
        return notificationService.list(user.id(), unread);
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@AuthenticationPrincipal AuthUser user, @PathVariable long id) {
        notificationService.markRead(user.id(), id);
    }

    @PatchMapping("/read-all")
    public NotificationService.ReadAllResult markAllRead(@AuthenticationPrincipal AuthUser user) {
        return notificationService.markAllRead(user.id());
    }
}
