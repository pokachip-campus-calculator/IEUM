package com.ieum.signal.repository;

import com.ieum.signal.entity.SignalEvent;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] signal_events 테이블 조회·저장 통로. */
public interface SignalEventRepository extends JpaRepository<SignalEvent, Long> {

    // 쪽지 1건당 신호는 1행이라, 저장 전에 이미 있는지 확인한다
    boolean existsByMessageId(Long messageId);

    // 쪽지 상세(이음쌤)에서 그 묶음 메시지들에 붙은 신호를 찾는다
    java.util.List<SignalEvent> findByMessageIdIn(java.util.Collection<Long> messageIds);
}
