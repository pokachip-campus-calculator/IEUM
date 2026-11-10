package com.ieum.practice.dto;

import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;
import com.ieum.record.entity.RecordStatus;

import java.time.OffsetDateTime;

/** [역할] 연습 목록(08)과 홈(07)에 나오는 연습 카드 한 장. content는 담지 않고, myStatus는 기록이 없으면 NONE이다. completedAt이 있으면 다시 하는 중이어도 완료한 적 있는 연습이다. */
public record PracticeItem(Long id, PracticeType type, PracticeArea area, String topic, int level,
                           String title, String summary, int estMinutes, MyStatus myStatus,
                           OffsetDateTime completedAt) {

    /** [역할] 내 진행 상태. DB의 RecordStatus에 "기록 없음(NONE)"을 더한 값이다. */
    public enum MyStatus {
        NONE, IN_PROGRESS, DONE;

        public static MyStatus of(RecordStatus status) {
            if (status == null) return NONE;
            return status == RecordStatus.DONE ? DONE : IN_PROGRESS;
        }
    }
}
