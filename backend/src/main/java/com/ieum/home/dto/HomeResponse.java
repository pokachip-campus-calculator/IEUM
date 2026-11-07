package com.ieum.home.dto;

import com.ieum.practice.dto.PracticeItem;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * [역할] 홈(07) 응답. resume은 이어서 할 연습(모두 마쳤으면 null)이다.
 * [주의] inProgress는 resume을 뺀 하는 중인 연습 최대 2개, recent는 마친 날짜 최신 3개다.
 */
public record HomeResponse(String nickname, long unreadMessages, long doneTotal,
                           PracticeItem resume, List<PracticeItem> inProgress,
                           List<AreaProgress> areas, List<RecentItem> recent) {

    /** [역할] 영역별 진행 현황(공개된 연습 수와 마친 수). */
    public record AreaProgress(PracticeArea area, long total, long done) {}

    /** [역할] 최근에 마친 연습 한 건. */
    public record RecentItem(Long id, PracticeType type, PracticeArea area, String topic, int level,
                             String title, LocalDateTime completedAt) {}
}
