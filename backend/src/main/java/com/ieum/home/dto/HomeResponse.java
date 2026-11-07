package com.ieum.home.dto;

import com.ieum.practice.dto.PracticeItem.MyStatus;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 홈(07) 응답. 기준서 3장 07의 모양을 그대로 따른다.
 * [주의] resume은 이어서 할 연습(모두 마쳤으면 null), inProgress는 resume을 뺀 하는 중인 연습 최대 2개,
 *        recent는 마친 날짜 최신 3개다. 시간은 +09:00이 붙은 ISO-8601이다.
 */
public record HomeResponse(String nickname, long unreadMessages, long doneTotal,
                           Resume resume, List<InProgressItem> inProgress,
                           List<AreaProgress> areas, List<RecentItem> recent) {

    /** [역할] 이어서 할 연습. status는 기록이 없으면 NONE, 하는 중이면 IN_PROGRESS다. */
    public record Resume(Long practiceId, String title, PracticeType type, PracticeArea area,
                         int level, int estMinutes, MyStatus status) {}

    /** [역할] 하는 중인 연습 한 건. */
    public record InProgressItem(Long practiceId, String title, PracticeArea area, int level) {}

    /** [역할] 영역별로 마친 연습 수. */
    public record AreaProgress(PracticeArea area, long doneCount) {}

    /** [역할] 최근에 마친 연습 한 건. */
    public record RecentItem(Long practiceId, String title, PracticeArea area, OffsetDateTime completedAt) {}
}
