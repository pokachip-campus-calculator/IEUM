package com.ieum.message.repository;

import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.ThreadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** [역할] message_threads 테이블 조회·저장 통로. */
public interface MessageThreadRepository extends JpaRepository<MessageThread, Long> {

    List<MessageThread> findByStudentIdOrderByLastMessageAtDescIdDesc(Long studentId);

    List<MessageThread> findByStudentIdAndStatusOrderByLastMessageAtDescIdDesc(Long studentId, ThreadStatus status);

    // 이음쌤 한 명의 모든 쪽지 묶음(N+1 금지). 호출 쪽에서 studentId별로 묶어 집계한다
    List<MessageThread> findByTeacherId(Long teacherId);

    // 이음쌤 쪽지함(19): 내 담당 쪽지를 최근 메시지 순으로
    List<MessageThread> findByTeacherIdOrderByLastMessageAtDescIdDesc(Long teacherId);

    List<MessageThread> findByTeacherIdAndStatusOrderByLastMessageAtDescIdDesc(Long teacherId, ThreadStatus status);

    long countByTeacherIdAndStatus(Long teacherId, ThreadStatus status);
}
