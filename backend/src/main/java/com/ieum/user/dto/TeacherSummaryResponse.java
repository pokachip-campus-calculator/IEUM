package com.ieum.user.dto;

/** [역할] 이음쌤 홈 요약(16) 응답. 담당 학습자 수·대기 쪽지 수·열린 신호 수. */
public record TeacherSummaryResponse(int studentCount, int waitingThreadCount, int openSignalCount) {
}
