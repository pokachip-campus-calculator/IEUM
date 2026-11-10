package com.ieum.user.dto;

import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;
import com.ieum.record.dto.RecordListResponse.Compare;
import com.ieum.record.service.RecordViewMapper.EmotionView;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 이음쌤 학습자 상세(18) 응답.
 * [동작] records는 DONE만 completed_at 최신순이고, compare는 UNIT에만 emotion은 EMOTION에만 채운다.
 * [연결] TeacherHomeService가 만든다 / RecordViewMapper(compare·emotion 변환)
 * [주의] SCENARIO는 제목·날짜만 내려서 compare·emotion은 항상 null이다. 점수·answers·my_note는 담지 않는다.
 */
public record TeacherStudentDetailResponse(Long id, String nickname, OffsetDateTime assignedAt, boolean hasOpenSignal,
                                           int doneCount, List<RecordItem> records, List<ThreadItem> threads) {

    public record RecordItem(Long practiceId, String title, PracticeType type, PracticeArea area, int level,
                             OffsetDateTime completedAt, List<Compare> compare, EmotionView emotion) {}

    public record ThreadItem(Long id, ThreadTopic topic, ThreadStatus status, OffsetDateTime createdAt) {}
}
