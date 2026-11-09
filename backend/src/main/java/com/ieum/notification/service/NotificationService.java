package com.ieum.notification.service;

import org.springframework.stereotype.Service;

/**
 * [역할] 쪽지·배정이 일어날 때 알림 행을 만든다.
 * [동작] 지금은 호출 자리만 만든 빈 구현이다. #49에서 notifications 저장과 고정 문구를 채운다.
 * [연결] ThreadService가 쪽지를 저장한 같은 트랜잭션에서 부른다(12) / notifications 테이블
 * [주의] 제목·본문은 서버가 정한 문구만 쓰고 쪽지 내용은 넣지 않는다. 호출 시그니처는 #49가 안쪽만 채우도록 유지한다.
 */
@Service
public class NotificationService {

    // NOTE_RECEIVED: 담당 이음쌤에게 "새 쪽지가 도착했어요" (누르면 쪽지 묶음)
    public void noteReceived(Long teacherId, Long threadId) {
        // #49에서 구현
    }

    // TEACHER_ASSIGNED: 학습자에게 "담당 이음쌤이 정해졌어요" (누르면 내 정보)
    public void teacherAssigned(Long studentId) {
        // #49에서 구현
    }

    // LEARNER_ASSIGNED: 이음쌤에게 "새 학습자가 배정됐어요" (누르면 쪽지 묶음)
    public void learnerAssigned(Long teacherId, Long threadId) {
        // #49에서 구현
    }
}
