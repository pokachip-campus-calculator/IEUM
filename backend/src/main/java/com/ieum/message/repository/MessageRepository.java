package com.ieum.message.repository;

import com.ieum.message.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] messages 테이블 조회·저장 통로. */
public interface MessageRepository extends JpaRepository<Message, Long> {
}
