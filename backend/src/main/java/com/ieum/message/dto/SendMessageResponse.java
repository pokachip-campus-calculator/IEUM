package com.ieum.message.dto;

import com.ieum.message.entity.SenderRole;

import java.time.OffsetDateTime;

/** [역할] 이어쓰기·답장(15) 응답. 신호 검사 결과는 학습자에게 알리지 않는 약속이라 넣지 않는다. */
public record SendMessageResponse(Long id, SenderRole senderRole, String body, OffsetDateTime createdAt) {
}
