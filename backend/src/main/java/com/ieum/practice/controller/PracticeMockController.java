package com.ieum.practice.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.mock.MockSupport;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.ieum.mock.MockSupport.obj;

/**
 * [역할] 학습 기록 11 GET /records의 가짜 응답을 내린다.
 * [동작] DB 없이 샘플 2건(마친 UNIT, 하는 중인 SCENARIO)을 고정값으로 돌려준다.
 * [연결] 화면 S10 / 실제 구현 이슈 #45 (09·10은 PracticeDetailMockController)
 * [주의] 학습자만 호출할 수 있다(이음쌤은 403).
 */
@RestController
@RequestMapping
public class PracticeMockController {

    // TODO: 실제 구현으로 교체 (#45) — practice_records × practices 조회, UNIT은 사전·사후 답으로 compare 계산
    @GetMapping("/records")
    public Map<String, Object> records(@AuthenticationPrincipal AuthUser user,
                                       @RequestParam(required = false) String status,
                                       @RequestParam(required = false) String sort) {
        MockSupport.requireStudent(user);
        MockSupport.checkAllowed("status", status, Set.of("DONE", "IN_PROGRESS"));
        MockSupport.checkAllowed("sort", sort, Set.of("recent", "old"));

        // 최신순 기준 샘플 2건: 마친 UNIT(compare 있음), 하는 중인 SCENARIO(compare null)
        List<Map<String, Object>> items = new ArrayList<>(List.of(
                obj("practiceId", 1, "title", "안전·자기 보호", "type", "UNIT", "area", "SAFETY", "level", 1,
                        "status", "DONE", "completedAt", "2026-10-29T15:00:00+09:00", "updatedAt", "2026-10-29T15:00:00+09:00",
                        "compare", List.of(obj("questionId", "q1",
                                "text", "처음 보는 사람이 “둘만의 비밀이야”라며 내 사진을 보내 달래요.",
                                "then", "잘 모르겠어요", "now", "보내지 않고 대화를 멈춘다", "changed", true))),
                obj("practiceId", 2, "title", "온라인에서 받은 비밀 부탁", "type", "SCENARIO", "area", "HELP", "level", 1,
                        "status", "IN_PROGRESS", "completedAt", null, "updatedAt", "2026-10-28T11:00:00+09:00",
                        "compare", null)));
        List<Map<String, Object>> filtered = items.stream()
                .filter(i -> status == null || status.equals(i.get("status")))
                .collect(Collectors.toCollection(ArrayList::new));
        if ("old".equals(sort)) {
            Collections.reverse(filtered);
        }
        // 개수는 필터와 관계없이 전체 기준
        return obj("doneCount", 1, "inProgressCount", 1, "items", filtered);
    }

}
