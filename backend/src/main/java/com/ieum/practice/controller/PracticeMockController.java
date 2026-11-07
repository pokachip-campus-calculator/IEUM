package com.ieum.practice.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.mock.MockSupport;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
 * [역할] 연습 상세 09 GET /practices/{id}, 진행 저장 10 PUT /practices/{id}/record, 학습 기록 11 GET /records의 가짜 응답을 내린다.
 * [동작] DB 없이 db/V3 시드와 같은 연습 3개(1 UNIT, 2 SCENARIO, 3 EMOTION)를 고정값으로 돌려준다.
 * [연결] 화면 S07~S10 / 실제 구현 이슈 #44(09·10), #45(11)
 * [주의] 기존 PracticeController(08)와 주소만 같은 /practices를 쓰고 파일은 분리했다. 학습자만 호출할 수 있다(이음쌤은 403).
 */
@RestController
@RequestMapping
public class PracticeMockController {

    private static final Set<Long> IDS = Set.of(1L, 2L, 3L);

    /** 10번 요청. answers 안의 구조는 연습 유형마다 다르므로 그대로 받아 그대로 돌려준다. */
    public record SaveRecordRequest(Map<String, Object> answers, String myNote, Boolean done, Boolean restart) {}

    // TODO: 실제 구현으로 교체 (#44) — practices + practice_records 조회, published=0이면 NOT_FOUND
    @GetMapping("/practices/{id}")
    public Map<String, Object> detail(@AuthenticationPrincipal AuthUser user, @PathVariable long id) {
        MockSupport.requireStudent(user);
        if (!IDS.contains(id)) {
            throw MockSupport.notFound();
        }
        Map<String, Object> practice = switch ((int) id) {
            case 1 -> obj("id", 1, "type", "UNIT", "area", "SAFETY", "topic", "안전·자기 보호", "level", 1,
                    "title", "안전·자기 보호",
                    "summary", "랜선 연애와 그루밍, 낯선 사람, 또래의 비행 권유에서 멈추는 연습이에요.", "estMinutes", 10);
            case 2 -> obj("id", 2, "type", "SCENARIO", "area", "HELP", "topic", "시나리오 연습", "level", 1,
                    "title", "온라인에서 받은 비밀 부탁",
                    "summary", "정해진 답 없이 상황을 고르고, 내가 편한 말로 대답해 보는 연습이에요.", "estMinutes", 10);
            default -> obj("id", 3, "type", "EMOTION", "area", "EMOTION", "topic", "감정 읽기", "level", 1,
                    "title", "혼자 떨어져 앉은 친구",
                    "summary", "짧은 장면을 보고 뚜렷한 단서로 마음을 고르는 연습이에요.", "estMinutes", 10);
        };
        practice.put("content", MockSupport.practiceContent(id));
        practice.put("record", sampleRecord(id));
        return practice;
    }

    // TODO: 실제 구현으로 교체 (#44) — answers 검증, done/restart 처리 후 practice_records 1행 저장
    @PutMapping("/practices/{id}/record")
    public Map<String, Object> saveRecord(@AuthenticationPrincipal AuthUser user, @PathVariable long id,
                                          @RequestBody SaveRecordRequest request) {
        MockSupport.requireStudent(user);
        if (!IDS.contains(id)) {
            throw MockSupport.notFound();
        }
        String now = MockSupport.now();
        // restart:true는 answers·myNote를 비우고 IN_PROGRESS로 되돌린다(다른 필드는 무시)
        if (Boolean.TRUE.equals(request.restart())) {
            return obj("status", "IN_PROGRESS", "answers", Map.of(), "myNote", null, "updatedAt", now, "completedAt", null);
        }
        Map<String, Object> answers = request.answers() == null ? Map.of() : request.answers();
        // myNote는 SCENARIO(id 2)에서만 저장하고 500자까지다
        String myNote = id == 2 ? request.myNote() : null;
        if (myNote != null && myNote.length() > 500) {
            throw ApiException.invalid("myNote", "500자 이하로 적어 주세요.");
        }
        boolean done = Boolean.TRUE.equals(request.done());
        if (done && answers.isEmpty()) {
            throw new ApiException(ErrorCode.RECORD_INCOMPLETE);
        }
        return obj("status", done ? "DONE" : "IN_PROGRESS", "answers", answers, "myNote", myNote,
                "updatedAt", now, "completedAt", done ? now : null);
    }

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

    // 09번 record 샘플(07·08·11과 맞춤): 1은 마친 기록, 2는 하는 중, 3은 기록 없음(null)
    private Map<String, Object> sampleRecord(long id) {
        return switch ((int) id) {
            case 1 -> obj("status", "DONE",
                    "answers", obj("pre", Map.of("q1", "c"), "cardsRead", List.of(1, 2, 3, 4, 5), "post", Map.of("q1", "b")),
                    "myNote", null, "updatedAt", "2026-10-29T15:00:00+09:00", "completedAt", "2026-10-29T15:00:00+09:00");
            case 2 -> obj("status", "IN_PROGRESS",
                    "answers", obj("choice", "c2"),
                    "myNote", null, "updatedAt", "2026-10-28T11:00:00+09:00", "completedAt", null);
            default -> null;
        };
    }
}
