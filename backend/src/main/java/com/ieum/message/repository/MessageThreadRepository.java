package com.ieum.message.repository;

import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.ThreadStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** [역할] message_threads 테이블 조회·저장 통로. */
public interface MessageThreadRepository extends JpaRepository<MessageThread, Long> {

    List<MessageThread> findByStudentIdOrderByLastMessageAtDesc(Long studentId);

    List<MessageThread> findByStudentIdAndStatusOrderByLastMessageAtDesc(Long studentId, ThreadStatus status);

    List<MessageThread> findByTeacherIdOrderByLastMessageAtDesc(Long teacherId);
}
