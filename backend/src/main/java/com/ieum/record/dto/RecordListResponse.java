package com.ieum.record.dto;

import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;
import com.ieum.record.entity.RecordStatus;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 내 학습 기록(11) 응답. 개수 두 개와 기록 목록이다.
 * [동작] doneCount·inProgressCount는 status 필터와 관계없이 내 전체 기록 기준이다.
 * [연결] 화면 S10 / RecordService
 * [주의] compare는 UNIT이고 사전·사후 답이 모두 있을 때만 채우고 그 외에는 null이다. 점수는 없다.
 */
public record RecordListResponse(int doneCount, int inProgressCount, List<Item> items) {

    /** completedAt이 있으면 다시 하는 중(IN_PROGRESS)이어도 완료한 적 있는 연습이다. */
    public record Item(Long practiceId, String title, PracticeType type, PracticeArea area, int level,
                       RecordStatus status, OffsetDateTime completedAt, OffsetDateTime updatedAt,
                       List<Compare> compare) {}

    /** 사전 답(then)과 사후 답(now)의 선택지 문구. 달라졌는지만 changed로 알려 준다. */
    public record Compare(String questionId, String text, String then, String now, boolean changed) {}
}
