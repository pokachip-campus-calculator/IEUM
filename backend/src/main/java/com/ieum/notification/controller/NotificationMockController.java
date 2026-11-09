package com.ieum.notification.controller;

import com.ieum.mock.MockSupport;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.ieum.mock.MockSupport.obj;

/**
 * [역할] 알림 22 GET /notifications, 23 PATCH /notifications/{id}/read, 24 PATCH /notifications/read-all의 가짜 응답을 내린다.
 * [동작] DB 없이 알림 4개(41~44, 안 읽음 3개)를 고정값으로 돌려준다. 읽음 처리는 저장하지 않으니 다시 불러도 그대로다.
 * [연결] 화면 S15와 사이드 메뉴 배지 / 실제 구현 이슈 #49
 * [주의] 학습자·이음쌤이 같은 API를 쓴다. 알림 제목·본문은 고정 문구뿐이다(쪽지 내용·찾은 낱말 없음).
 */
@RestController
@RequestMapping("/notifications")
public class NotificationMockController {

    private static final Set<Long> IDS = Set.of(41L, 42L, 43L, 44L);

    // TODO: 실제 구현으로 교체 (#49) — 토큰의 사용자 id로 본인 알림만, 최신순 최대 50건
    @GetMapping
    public Map<String, Object> list(@RequestParam(required = false) String unread) {
        MockSupport.checkAllowed("unread", unread, Set.of("true", "false"));
        List<Map<String, Object>> items = List.of(
                obj("id", 41, "type", "REPLY_ARRIVED", "title", "이음쌤의 답장이 도착했어요", "body", "쪽지함에서 확인해 보세요",
                        "linkType", "THREAD", "linkId", 7, "isRead", false, "createdAt", "2026-11-02T09:12:00+09:00"),
                obj("id", 42, "type", "NOTE_READ", "title", "이음쌤이 쪽지를 읽었어요", "body", "쪽지함에서 확인해 보세요",
                        "linkType", "THREAD", "linkId", 7, "isRead", false, "createdAt", "2026-11-01T18:40:00+09:00"),
                obj("id", 43, "type", "TEACHER_ASSIGNED", "title", "담당 이음쌤이 정해졌어요", "body", "내 정보에서 확인해 보세요",
                        "linkType", "PROFILE", "linkId", null, "isRead", false, "createdAt", "2026-11-01T18:30:00+09:00"),
                obj("id", 44, "type", "NOTE_RECEIVED", "title", "새 쪽지가 도착했어요", "body", "쪽지 모아 보기에서 확인해 보세요",
                        "linkType", "THREAD", "linkId", 7, "isRead", true, "createdAt", "2026-10-30T10:00:00+09:00"));
        boolean onlyUnread = "true".equals(unread);
        return obj("unreadCount", 3, "items", items.stream()
                .filter(i -> !onlyUnread || Boolean.FALSE.equals(i.get("isRead")))
                .toList());
    }

    // TODO: 실제 구현으로 교체 (#49) — 본인 알림이 아니거나 없는 id면 NOT_FOUND, 이미 읽은 알림은 그대로 204
    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@PathVariable long id) {
        if (!IDS.contains(id)) {
            throw MockSupport.notFound();
        }
    }

    // TODO: 실제 구현으로 교체 (#49) — 내 안 읽은 알림을 모두 읽음으로 바꾸고 바뀐 개수를 돌려준다
    @PatchMapping("/read-all")
    public Map<String, Object> readAll() {
        return obj("updated", 3);
    }
}
