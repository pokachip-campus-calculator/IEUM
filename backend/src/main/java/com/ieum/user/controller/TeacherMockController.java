package com.ieum.user.controller;

import com.ieum.common.ApiException;
import com.ieum.mock.MockSupport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.ieum.mock.MockSupport.obj;

/**
 * [역할] 이음쌤 16 GET /teacher/summary, 17 GET /teacher/students, 18 GET /teacher/students/{id},
 *        19 GET /teacher/threads, 20 GET /teacher/signals, 21 PATCH /teacher/signals/{id}의 가짜 응답을 내린다.
 * [동작] mock.learning.enabled=true일 때만 고정 학습자·쪽지·신호를 돌려주고, 실제 연동 모드에서는 빈 목록을 돌려준다.
 * [연결] 화면 T01~T03 / 실제 구현 이슈 #50(16~18), #51(19~21)
 * [주의] /teacher/**는 SecurityConfig가 이음쌤만 통과시킨다. 응답에 점수·신호 등급·나에게 한 줄(my_note)은 넣지 않는다.
 */
@RestController
@RequestMapping("/teacher")
public class TeacherMockController {

    @Value("${mock.learning.enabled:true}")
    private boolean mockEnabled;

    /** 21번 요청. memo는 생략하면 그대로 두고 학습자에게는 보이지 않는다. */
    public record HandleSignalRequest(Boolean handled, String memo) {}

    // TODO: 실제 구현으로 교체 (#50) — 담당 학습자 수, 대기 쪽지 수, 열린 신호 수 집계
    @GetMapping("/summary")
    public Map<String, Object> summary() {
        if (!mockEnabled) {
            return obj("studentCount", 0, "waitingThreadCount", 0, "openSignalCount", 0);
        }
        return obj("studentCount", 5, "waitingThreadCount", 2, "openSignalCount", 1);
    }

    // TODO: 실제 구현으로 교체 (#50) — 내가 담당하는 학습자만 조회, q 닉네임 부분 일치, sort 정렬
    @GetMapping("/students")
    public Map<String, Object> students(@RequestParam(required = false) String q,
                                        @RequestParam(required = false) String sort) {
        MockSupport.checkAllowed("sort", sort, Set.of("nickname", "assigned", "recent"));
        if (!mockEnabled) {
            return obj("items", List.of());
        }
        List<Map<String, Object>> items = new ArrayList<>(List.of(
                obj("id", 12, "nickname", "하늘", "assignedAt", "2026-11-04T10:30:00+09:00",
                        "lastActivityAt", "2026-11-04T14:00:00+09:00", "doneCount", 4, "waitingThreadCount", 1, "hasOpenSignal", true),
                obj("id", 13, "nickname", "바다", "assignedAt", "2026-11-05T09:00:00+09:00",
                        "lastActivityAt", null, "doneCount", 0, "waitingThreadCount", 1, "hasOpenSignal", false)));
        items.removeIf(i -> q != null && !q.isBlank() && !((String) i.get("nickname")).contains(q));
        // 기본(nickname)은 가나다순, assigned는 최근 배정 먼저, recent는 최근 활동 먼저(활동 없음은 맨 뒤)
        Comparator<Map<String, Object>> order = switch (sort == null ? "nickname" : sort) {
            case "assigned" -> Comparator.comparing((Map<String, Object> i) -> (String) i.get("assignedAt")).reversed();
            case "recent" -> Comparator.comparing((Map<String, Object> i) -> (String) i.get("lastActivityAt"),
                    Comparator.nullsFirst(Comparator.<String>naturalOrder())).reversed();
            default -> Comparator.comparing((Map<String, Object> i) -> (String) i.get("nickname"));
        };
        items.sort(order);
        return obj("items", items);
    }

    // TODO: 실제 구현으로 교체 (#50) — 담당 학습자가 아니면 FORBIDDEN, records는 DONE만(SCENARIO는 answers·my_note 제외)
    @GetMapping("/students/{id}")
    public Map<String, Object> studentDetail(@PathVariable long id) {
        if (!mockEnabled || id != 12) {
            throw MockSupport.notFound();
        }
        return obj("id", 12, "nickname", "하늘", "assignedAt", "2026-11-04T10:30:00+09:00", "hasOpenSignal", true, "doneCount", 4,
                "records", List.of(
                        obj("practiceId", 1, "title", "안전·자기 보호", "type", "UNIT", "area", "SAFETY", "level", 1,
                                "completedAt", "2026-10-29T15:00:00+09:00",
                                "compare", List.of(obj("questionId", "q1",
                                        "text", "처음 보는 사람이 “둘만의 비밀이야”라며 내 사진을 보내 달래요.",
                                        "then", "잘 모르겠어요", "now", "보내지 않고 대화를 멈춘다", "changed", true)),
                                "emotion", null),
                        obj("practiceId", 3, "title", "혼자 떨어져 앉은 친구", "type", "EMOTION", "area", "MIND", "level", 1,
                                "completedAt", "2026-10-27T11:00:00+09:00", "compare", null,
                                "emotion", obj("clues", List.of("표정 · 시선을 아래로 향해요"), "feelings", List.of("서운함")))),
                "threads", List.of(
                        obj("id", 31, "topic", "ONLINE", "status", "WAITING", "createdAt", "2026-11-04T10:30:00+09:00")));
    }

    // TODO: 실제 구현으로 교체 (#51) — 내가 담당하는 학습자의 쪽지만, status 필터, lastMessageAt 최신 순
    @GetMapping("/threads")
    public Map<String, Object> threads(@RequestParam(required = false) String status) {
        MockSupport.checkAllowed("status", status, Set.of("WAITING", "ANSWERED"));
        if (!mockEnabled) {
            return obj("items", List.of());
        }
        List<Map<String, Object>> items = List.of(
                obj("id", 31, "student", obj("id", 12, "nickname", "하늘"), "topic", "ONLINE", "status", "WAITING",
                        "lastMessageAt", "2026-11-04T10:30:00+09:00", "preview", "게임에서 알게 된 사람이 사진을 보내 달래요",
                        "linkedPractice", null, "hasSignal", true),
                obj("id", 32, "student", obj("id", 13, "nickname", "바다"), "topic", "SCHOOL", "status", "ANSWERED",
                        "lastMessageAt", "2026-11-03T09:30:00+09:00", "preview", "요즘 학교에 가기가 조금 힘들어요",
                        "linkedPractice", null, "hasSignal", false));
        return obj("items", items.stream().filter(i -> status == null || status.equals(i.get("status"))).toList());
    }

    // TODO: 실제 구현으로 교체 (#51) — signal_events 조회, 정렬은 OPEN 먼저 → CRITICAL 먼저 → 최신 순
    @GetMapping("/signals")
    public Map<String, Object> signals(@RequestParam(required = false) String status) {
        MockSupport.checkAllowed("status", status, Set.of("OPEN", "HANDLED"));
        if (!mockEnabled) {
            return obj("items", List.of());
        }
        return obj("items", List.of(signal(5, false, null), signal(6, true, "다음 날 담임과 통화했고 1388을 안내했다")).stream()
                .filter(i -> status == null || status.equals(i.get("status")))
                .toList());
    }

    // TODO: 실제 구현으로 교체 (#51) — 담당 학습자의 신호가 아니면 FORBIDDEN, handled·handled_at·response_memo 갱신
    @PatchMapping("/signals/{id}")
    public Map<String, Object> handleSignal(@PathVariable long id, @RequestBody HandleSignalRequest request) {
        if (!mockEnabled || id != 5 && id != 6) {
            throw MockSupport.notFound();
        }
        if (request.handled() == null) {
            throw ApiException.invalid("handled", "처리 여부를 보내 주세요.");
        }
        if (request.memo() != null && request.memo().length() > 500) {
            throw ApiException.invalid("memo", "500자 이하로 적어 주세요.");
        }
        // memo를 생략하면 기존 값을 그대로 둔다(샘플 기준: 5는 null, 6은 기존 메모)
        String memo = request.memo() != null ? request.memo() : (id == 6 ? "다음 날 담임과 통화했고 1388을 안내했다" : null);
        return signal(id, request.handled(), memo);
    }

    // 20번 항목 하나. handled면 HANDLED + handledAt, 아니면 OPEN + handledAt null
    private Map<String, Object> signal(long id, boolean handled, String memo) {
        boolean first = id == 5;
        return obj("id", id, "status", handled ? "HANDLED" : "OPEN", "matchedText", first ? "죽고 싶다" : "비밀",
                "student", obj("id", first ? 12 : 13, "nickname", first ? "하늘" : "바다", "assignedAt",
                        first ? "2026-11-04T10:30:00+09:00" : "2026-11-05T09:00:00+09:00"),
                "message", obj("id", first ? 101 : 103, "threadId", first ? 31 : 32,
                        "body", first ? "게임에서 알게 된 사람이 사진을 보내 달래요" : "요즘 학교에 가기가 조금 힘들어요",
                        "createdAt", first ? "2026-11-04T10:30:00+09:00" : "2026-11-03T09:00:00+09:00"),
                "handledAt", handled ? MockSupport.now() : null, "responseMemo", memo,
                "createdAt", first ? "2026-11-04T10:30:00+09:00" : "2026-11-03T09:00:00+09:00");
    }
}
