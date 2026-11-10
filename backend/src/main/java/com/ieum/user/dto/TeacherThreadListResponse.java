package com.ieum.user.dto;

import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.signal.entity.SignalStatus;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 이음쌤 쪽지함(19) 응답.
 * [동작] preview는 첫 메시지 앞 40자이다. hasSignal은 신호가 하나라도 붙은 쪽지인지이고,
 *        signalStatus는 신호가 있을 때만 OPEN(처리 안 한 신호가 하나라도 있음) 또는 HANDLED(전부 처리됨), 없으면 null이다.
 * [연결] TeacherInboxService가 만든다 / 화면 T02
 * [주의] 신호 등급은 담지 않는다. 연결된 시나리오가 없으면 linkedPractice는 null이다.
 */
public record TeacherThreadListResponse(List<Item> items) {

    /** [역할] 쪽지함 한 줄. */
    public record Item(Long id, Student student, ThreadTopic topic, ThreadStatus status, OffsetDateTime lastMessageAt,
                       String preview, LinkedPractice linkedPractice, boolean hasSignal,
                       SignalStatus signalStatus) {}

    /** [역할] 쪽지를 보낸 학습자의 id·닉네임. */
    public record Student(Long id, String nickname) {}

    /** [역할] 쪽지에 연결된 연습(시나리오)의 id·제목. */
    public record LinkedPractice(Long id, String title) {}
}
