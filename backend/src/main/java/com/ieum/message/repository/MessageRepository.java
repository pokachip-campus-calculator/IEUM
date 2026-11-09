package com.ieum.message.repository;

import com.ieum.message.entity.Message;
import com.ieum.message.entity.SenderRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** [역할] messages 테이블 조회·저장 통로. */
public interface MessageRepository extends JpaRepository<Message, Long> {

    java.util.List<Message> findByThreadIdOrderByIdAsc(Long threadId);

    java.util.List<Message> findByThreadIdAndSenderRoleAndReadAtIsNull(Long threadId, SenderRole senderRole);

    // 학습자가 아직 읽지 않은 이음쌤 답장 수(홈의 unreadMessages)
    @Query("select count(m) from Message m where m.senderRole = :sender and m.readAt is null "
            + "and m.threadId in (select t.id from MessageThread t where t.studentId = :studentId)")
    long countUnreadReplies(@Param("studentId") Long studentId, @Param("sender") SenderRole sender);
}
