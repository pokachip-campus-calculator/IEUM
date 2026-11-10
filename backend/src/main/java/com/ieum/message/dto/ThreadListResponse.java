package com.ieum.message.dto;

import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;

import java.time.OffsetDateTime;
import java.util.List;

/** [역할] 내 쪽지함(13) 응답. 연결된 시나리오가 없으면 linkedPractice는 null이다. */
public record ThreadListResponse(List<Item> items) {

    /** [역할] 쪽지함 한 줄(preview는 첫 쪽지 앞 40자, unread는 안 읽은 이음쌤 답장이 있는지). */
    public record Item(Long id, ThreadTopic topic, ThreadStatus status, OffsetDateTime createdAt,
                       OffsetDateTime lastMessageAt, String preview, boolean unread, LinkedPractice linkedPractice) {}

    /** [역할] 쪽지에 연결된 연습(시나리오)의 id·제목. */
    public record LinkedPractice(Long id, String title) {}
}
