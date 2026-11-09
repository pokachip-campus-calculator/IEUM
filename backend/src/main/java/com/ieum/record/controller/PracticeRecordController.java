package com.ieum.record.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.record.service.PracticeRecordService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/records")
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "false")
public class PracticeRecordController {

    private final PracticeRecordService recordService;

    public PracticeRecordController(PracticeRecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping
    public PracticeRecordService.RecordList list(@AuthenticationPrincipal AuthUser user,
                                                 @RequestParam(required = false) String status,
                                                 @RequestParam(required = false) String sort) {
        return recordService.list(user, status, sort);
    }
}
