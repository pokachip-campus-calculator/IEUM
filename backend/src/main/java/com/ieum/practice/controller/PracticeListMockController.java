package com.ieum.practice.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.mock.MockSupport;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.ieum.mock.MockSupport.obj;

/**
 * [역할] 연습 목록 08 GET /practices?area=&level=&q=의 가짜 응답을 내린다.
 * [동작] DB 없이 연습 3개를 고정값으로 두고 area·level·q 조건으로 걸러 낸다. myStatus는 1 DONE, 2 IN_PROGRESS, 3 NONE이다.
 * [연결] 화면 S06 / 실제 구현은 PracticeController(#43)
 * [주의] mock.learning.enabled=true(기본)일 때만 켜진다. 학습 전체 수동 테스트가 끝나 false로 바꾸면 이 파일을 지운다. 학습자만 호출할 수 있다.
 */
@RestController
@RequestMapping("/practices")
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "true", matchIfMissing = true)
public class PracticeListMockController {

    // TODO: 실제 구현으로 교체 (#43) — PracticeController·PracticeService 사용
    @GetMapping
    public Map<String, Object> list(@AuthenticationPrincipal AuthUser user,
                                    @RequestParam(required = false) String area,
                                    @RequestParam(required = false) String level,
                                    @RequestParam(required = false) String q) {
        MockSupport.requireStudent(user);
        MockSupport.checkAllowed("area", area, Set.of("SAFETY", "RELATION", "MIND", "LIFE", "INDEPENDENCE"));
        Integer levelValue = null;
        if (level != null) {
            try {
                levelValue = Integer.valueOf(level);
            } catch (NumberFormatException e) {
                throw ApiException.invalid("level", "level 값이 올바르지 않아요.");
            }
        }
        final Integer wantedLevel = levelValue;
        List<Map<String, Object>> items = List.of(
                obj("id", 1, "type", "UNIT", "area", "SAFETY", "topic", "안전·자기 보호", "level", 1,
                        "title", "안전·자기 보호",
                        "summary", "랜선 연애와 그루밍, 낯선 사람, 또래의 비행 권유에서 멈추는 연습이에요.",
                        "estMinutes", 10, "myStatus", "DONE"),
                obj("id", 2, "type", "SCENARIO", "area", "RELATION", "topic", "시나리오 연습", "level", 1,
                        "title", "온라인에서 받은 비밀 부탁",
                        "summary", "정해진 답 없이 상황을 고르고, 내가 편한 말로 대답해 보는 연습이에요.",
                        "estMinutes", 10, "myStatus", "IN_PROGRESS"),
                obj("id", 3, "type", "EMOTION", "area", "MIND", "topic", "감정 읽기", "level", 1,
                        "title", "혼자 떨어져 앉은 친구",
                        "summary", "짧은 장면을 보고 뚜렷한 단서로 마음을 고르는 연습이에요.",
                        "estMinutes", 10, "myStatus", "NONE"));
        String keyword = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return obj("items", items.stream()
                .filter(i -> area == null || area.equals(i.get("area")))
                .filter(i -> wantedLevel == null || wantedLevel.equals(i.get("level")))
                .filter(i -> keyword.isEmpty()
                        || ((String) i.get("title")).toLowerCase(Locale.ROOT).contains(keyword)
                        || ((String) i.get("summary")).toLowerCase(Locale.ROOT).contains(keyword))
                .toList());
    }
}
