package com.ieum.practice.dto;

import com.ieum.practice.entity.PracticeType;
import com.ieum.record.entity.RecordStatus;
import tools.jackson.databind.JsonNode;

import java.time.OffsetDateTime;

/**
 * [역할] 연습 상세 09의 응답. 연습 정보·content와 내 기록(record)을 한 번에 담는다.
 * [동작] 기록이 없으면 record는 null이다. 시각은 +09:00이 붙은 한국 시간이다.
 * [연결] PracticeDetailService가 만들고 PracticeDetailController가 내린다 / 10번 응답은 RecordView와 같다
 * [주의] content·answers는 DB의 JSON 문자열을 풀어서 내린다.
 */
public record PracticeDetailResponse(Long id, PracticeType type, String area, String topic, int level,
                                     String title, String summary, int estMinutes,
                                     JsonNode content, RecordView record) {

    /** 내 기록. 09의 record이자 10의 응답이다. */
    public record RecordView(RecordStatus status, JsonNode answers, String myNote,
                             OffsetDateTime updatedAt, OffsetDateTime completedAt) {}
}
