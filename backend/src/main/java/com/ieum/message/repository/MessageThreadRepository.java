package com.ieum.message.repository;

import com.ieum.message.entity.MessageThread;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] message_threads 테이블 조회·저장 통로. */
public interface MessageThreadRepository extends JpaRepository<MessageThread, Long> {
}
