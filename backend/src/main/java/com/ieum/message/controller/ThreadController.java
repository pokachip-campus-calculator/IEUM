package com.ieum.message.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.message.service.ThreadService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/threads")
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "false")
public class ThreadController {

    private final ThreadService threadService;

    public ThreadController(ThreadService threadService) {
        this.threadService = threadService;
    }

    public record CreateThreadRequest(String topic, String body, Long practiceId) {}
    public record SendMessageRequest(String body) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ThreadService.CreatedThread create(@AuthenticationPrincipal AuthUser user,
                                              @RequestBody CreateThreadRequest request) {
        return threadService.create(user, request.topic(), request.body(), request.practiceId());
    }

    @GetMapping
    public ThreadService.ThreadList list(@AuthenticationPrincipal AuthUser user,
                                         @RequestParam(required = false) String status) {
        return threadService.list(user, status);
    }

    @GetMapping("/{id}")
    public ThreadService.ThreadDetail detail(@AuthenticationPrincipal AuthUser user, @PathVariable long id) {
        return threadService.detail(user, id);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ThreadService.MessageView send(@AuthenticationPrincipal AuthUser user, @PathVariable long id,
                                          @RequestBody SendMessageRequest request) {
        return threadService.send(user, id, request.body());
    }
}
