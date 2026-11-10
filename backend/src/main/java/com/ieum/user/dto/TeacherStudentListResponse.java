package com.ieum.user.dto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 이음쌤 학습자 목록(17) 응답.
 * [동작] lastActivityAt은 기록 updated_at과 쪽지 최근 활동 중 늦은 것이고, 둘 다 없으면 null이다.
 * [연결] TeacherHomeService가 만든다
 * [주의] 점수·신호 등급·my_note는 담지 않는다.
 */
public record TeacherStudentListResponse(List<Item> items) {

    /** [역할] 담당 학습자 한 명의 목록 항목. */
    public record Item(Long id, String nickname, OffsetDateTime assignedAt, OffsetDateTime lastActivityAt,
                       int doneCount, int waitingThreadCount, boolean hasOpenSignal) {}
}
