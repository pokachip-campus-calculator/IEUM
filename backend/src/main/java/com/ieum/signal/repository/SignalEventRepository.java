package com.ieum.signal.repository;

import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.entity.SignalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] signal_events 테이블 조회·저장 통로. */
public interface SignalEventRepository extends JpaRepository<SignalEvent, Long> {

    // 쪽지 1건당 신호는 1행이라, 저장 전에 이미 있는지 확인한다
    boolean existsByMessageId(Long messageId);

    // 쪽지 상세(이음쌤)에서 그 묶음 메시지들에 붙은 신호를 찾는다
    java.util.List<SignalEvent> findByMessageIdIn(java.util.Collection<Long> messageIds);

    // 여러 학습자의 신호를 한 번에(N+1 금지). 이음쌤 홈 요약·학습자 목록에서 쓴다
    java.util.List<SignalEvent> findByStudentIdInAndStatus(java.util.Collection<Long> studentIds, SignalStatus status);

    // 학습자 한 명에게 처리 안 한 신호가 있는지(이음쌤 학습자 상세의 hasOpenSignal)
    boolean existsByStudentIdAndStatus(Long studentId, SignalStatus status);
}
