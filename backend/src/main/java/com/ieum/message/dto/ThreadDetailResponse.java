package com.ieum.message.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.ieum.message.entity.SenderRole;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.signal.entity.SignalStatus;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 쪽지 상세(14) 응답.
 * [동작] 쪽지 묶음 정보, 연결 시나리오(고른 선택지 포함), 두 사람의 닉네임, 메시지 목록을 담는다.
 * [연결] ThreadDetailService가 만든다 / 화면 S12·T02
 * [주의] signal은 이음쌤이 부를 때만 채우고, 비어 있으면 키 자체를 내리지 않는다(학습자 응답에는 항상 없다). my_note는 어떤 필드에도 없다.
 */
public record ThreadDetailResponse(
        Long id,
        ThreadTopic topic,
        ThreadStatus status,
        OffsetDateTime createdAt,
        LinkedPractice linkedPractice,
        Person student,
        Teacher teacher,
        @JsonInclude(JsonInclude.Include.NON_NULL) Signal signal,
        List<MessageItem> messages
) {
    public record LinkedPractice(Long id, String title, String pickedChoice) {}

    public record Person(Long id, String nickname) {}

    public record Teacher(String nickname) {}

    public record Signal(Long id, SignalStatus status) {}

    public record MessageItem(Long id, SenderRole senderRole, String body, OffsetDateTime createdAt) {}
}
