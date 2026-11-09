package com.ieum.message.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.mock.MockSupport;
import com.ieum.user.entity.Role;
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
import java.util.Map;
import java.util.Set;

import static com.ieum.mock.MockSupport.obj;

/**
 * [역할] 쪽지 12 POST /threads, 13 GET /threads, 14 GET /threads/{id}, 15 POST /threads/{id}/messages의 가짜 응답을 내린다.
 * [동작] DB 없이 쪽지 2개(31 ANSWERED, 32 WAITING)를 고정값으로 돌려주고, 저장 API는 받은 값을 확인만 하고 응답을 만든다.
 * [연결] 화면 S11·S12·T02 / 실제 구현 이슈 #46(12·13), #47(신호 검사), #48(14·15)
 * [주의] 12·13은 학습자만, 14·15는 학습자(본인)·이음쌤(담당)이 호출한다. signal은 이음쌤이 14를 부를 때만 내리고 학습자 응답에는 키 자체를 뺀다.
 */
@RestController
@RequestMapping("/threads")
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "true", matchIfMissing = true)
public class ThreadMockController {

    private static final Set<String> TOPICS = Set.of("FRIEND", "ONLINE", "SCHOOL", "HOME", "ETC");
    private static final Set<Long> IDS = Set.of(31L, 32L);

    /** 12번 요청. practiceId는 시나리오에서 넘어온 경우에만 온다. */
    public record CreateThreadRequest(String topic, String body, Long practiceId) {}

    /** 15번 요청. */
    public record SendMessageRequest(String body) {}

    // TODO: 실제 구현으로 교체 (#46) — 담당 이음쌤 자동 배정 + threads·messages 저장 + 신호 검사(#47) + 알림(#49)을 한 트랜잭션으로
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@AuthenticationPrincipal AuthUser user, @RequestBody CreateThreadRequest request) {
        MockSupport.requireStudent(user);
        if (request.topic() == null || !TOPICS.contains(request.topic())) {
            throw ApiException.invalid("topic", "주제를 골라 주세요.");
        }
        MockSupport.checkBody(request.body());
        return obj("id", 31, "status", "WAITING", "createdAt", MockSupport.now());
    }

    // TODO: 실제 구현으로 교체 (#46) — message_threads 조회, lastMessageAt 최신 순
    @GetMapping
    public Map<String, Object> list(@AuthenticationPrincipal AuthUser user, @RequestParam(required = false) String status) {
        MockSupport.requireStudent(user);
        MockSupport.checkAllowed("status", status, Set.of("WAITING", "ANSWERED"));
        List<Map<String, Object>> items = List.of(
                obj("id", 31, "topic", "ONLINE", "status", "ANSWERED",
                        "createdAt", "2026-11-04T10:30:00+09:00", "lastMessageAt", "2026-11-04T14:00:00+09:00",
                        "preview", "게임에서 알게 된 사람이 사진을 보내 달래요", "unread", true,
                        "linkedPractice", obj("id", 2, "title", "온라인에서 받은 비밀 부탁")),
                obj("id", 32, "topic", "SCHOOL", "status", "WAITING",
                        "createdAt", "2026-11-03T09:00:00+09:00", "lastMessageAt", "2026-11-03T09:00:00+09:00",
                        "preview", "요즘 학교에 가기가 조금 힘들어요", "unread", false,
                        "linkedPractice", null));
        return obj("items", items.stream()
                .filter(i -> status == null || status.equals(i.get("status")))
                .toList());
    }

    // TODO: 실제 구현으로 교체 (#48) — 접근 권한 검사(학습자 본인·담당 이음쌤), 상대 메시지 read_at 갱신, NOTE_READ 알림
    @GetMapping("/{id}")
    public Map<String, Object> detail(@AuthenticationPrincipal AuthUser user, @PathVariable long id) {
        if (!IDS.contains(id)) {
            throw MockSupport.notFound();
        }
        Map<String, Object> thread = id == 31
                ? obj("id", 31, "topic", "ONLINE", "status", "ANSWERED", "createdAt", "2026-11-04T10:30:00+09:00",
                        "linkedPractice", obj("id", 2, "title", "온라인에서 받은 비밀 부탁", "pickedChoice", "지금은 보내지 않겠다고 말하고 대화를 멈춘다."))
                : obj("id", 32, "topic", "SCHOOL", "status", "WAITING", "createdAt", "2026-11-03T09:00:00+09:00",
                        "linkedPractice", null);
        thread.put("student", obj("id", 12, "nickname", "하늘"));
        thread.put("teacher", obj("nickname", "푸른 이음쌤"));
        if (user.role() == Role.TEACHER) {
            thread.put("signal", obj("id", 5, "status", "OPEN"));
        }
        thread.put("messages", id == 31
                ? List.of(
                        obj("id", 101, "senderRole", "STUDENT", "body", "게임에서 알게 된 사람이 사진을 보내 달래요", "createdAt", "2026-11-04T10:30:00+09:00"),
                        obj("id", 102, "senderRole", "TEACHER", "body", "이야기해 줘서 고마워요. 지금 어떤 마음이에요?", "createdAt", "2026-11-04T14:00:00+09:00"))
                : List.of(
                        obj("id", 103, "senderRole", "STUDENT", "body", "요즘 학교에 가기가 조금 힘들어요", "createdAt", "2026-11-03T09:00:00+09:00")));
        return thread;
    }

    // TODO: 실제 구현으로 교체 (#48) — 접근 권한 검사, 학습자면 WAITING + 신호 검사, 이음쌤이면 ANSWERED, 알림 생성
    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> send(@AuthenticationPrincipal AuthUser user, @PathVariable long id,
                                    @RequestBody SendMessageRequest request) {
        if (!IDS.contains(id)) {
            throw MockSupport.notFound();
        }
        MockSupport.checkBody(request.body());
        String senderRole = user.role() == Role.TEACHER ? "TEACHER" : "STUDENT";
        return obj("id", 102, "senderRole", senderRole, "body", request.body(), "createdAt", MockSupport.now());
    }
}
