package com.ieum.message.dto;

import com.ieum.message.entity.ThreadStatus;

import java.time.OffsetDateTime;

/** [역할] 쪽지 보내기(12) 응답. 신호 검사 결과는 학습자에게 알리지 않는 약속이라 일부러 넣지 않는다. */
public record CreateThreadResponse(Long id, ThreadStatus status, OffsetDateTime createdAt) {
}
