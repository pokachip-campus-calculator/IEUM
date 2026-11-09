package com.ieum.home.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.mock.MockSupport;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

import static com.ieum.mock.MockSupport.obj;

/**
 * [역할] 홈 07 GET /home의 가짜 응답을 내린다.
 * [동작] DB 없이 고정값을 돌려준다. 값은 09~11·13 mock 샘플과 서로 맞춰 두었다(1번 마침, 2번 하는 중, 읽지 않은 답장 1개).
 * [연결] 화면 S05 / 실제 구현은 HomeController(#43)
 * [주의] mock.learning.enabled=true(기본)일 때만 켜진다. 학습 전체 수동 테스트가 끝나 false로 바꾸면 이 파일을 지운다. 학습자만 호출할 수 있다.
 */
@RestController
@RequestMapping("/home")
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "true", matchIfMissing = true)
public class HomeMockController {

    // TODO: 실제 구현으로 교체 (#43) — HomeController·HomeService 사용
    @GetMapping
    public Map<String, Object> home(@AuthenticationPrincipal AuthUser user) {
        MockSupport.requireStudent(user);
        return obj("nickname", "하늘", "unreadMessages", 1, "doneTotal", 1,
                "resume", obj("practiceId", 2, "title", "온라인에서 받은 비밀 부탁", "type", "SCENARIO", "area", "RELATION",
                        "level", 1, "estMinutes", 10, "myStatus", "IN_PROGRESS"),
                "inProgress", List.of(),
                "areas", List.of(obj("area", "SAFETY", "doneCount", 1), obj("area", "RELATION", "doneCount", 0),
                        obj("area", "MIND", "doneCount", 0), obj("area", "LIFE", "doneCount", 0),
                        obj("area", "INDEPENDENCE", "doneCount", 0)),
                "recent", List.of(obj("practiceId", 1, "title", "안전·자기 보호", "area", "SAFETY",
                        "completedAt", "2026-10-29T15:00:00+09:00")));
    }
}
