package com.ieum.user.dto;

import com.ieum.signal.entity.SignalStatus;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 이음쌤 신호 목록(20) 응답. 대응 기록(21)의 응답은 이 목록의 항목 1개(Item)다.
 * [동작] OPEN 먼저, 같은 상태에서는 CRITICAL 먼저, 최신 순으로 내려준다.
 * [연결] TeacherInboxService가 만든다 / 화면 T03
 * [주의] 신호 등급(severity)은 정렬에만 쓰고 응답에 넣지 않는다. responseMemo는 이음쌤 응답에만 있고 학습자 API에는 없다.
 */
public record TeacherSignalListResponse(List<Item> items) {

    /** [역할] 신호 한 건. handledAt·responseMemo는 아직 없으면 null이다. */
    public record Item(Long id, SignalStatus status, String matchedText, Student student, Message message,
                       OffsetDateTime handledAt, String responseMemo, OffsetDateTime createdAt) {}

    /** [역할] 신호를 낸 학습자(assignedAt은 내 담당이 된 시각). */
    public record Student(Long id, String nickname, OffsetDateTime assignedAt) {}

    /** [역할] 신호가 발견된 메시지(본문은 이음쌤에게만 보인다). */
    public record Message(Long id, Long threadId, String body, OffsetDateTime createdAt) {}
}
