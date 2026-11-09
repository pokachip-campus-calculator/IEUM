package com.ieum.message.repository;

import com.ieum.message.entity.Message;
import com.ieum.message.entity.SenderRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

/** [역할] messages 테이블 조회·저장 통로. 목록은 쪽지마다 따로 묻지 않고 한 번에 묶어서 가져온다. */
public interface MessageRepository extends JpaRepository<Message, Long> {

    // 쪽지 상세용: 한 묶음의 메시지를 보낸 순서대로
    List<Message> findByThreadIdOrderByIdAsc(Long threadId);

    // 각 쪽지 묶음의 첫 메시지(목록 preview용)
    @Query("select m from Message m where m.id in "
            + "(select min(f.id) from Message f where f.threadId in :threadIds group by f.threadId)")
    List<Message> findFirstMessages(@Param("threadIds") Collection<Long> threadIds);

    // 받는 사람이 아직 안 읽은 메시지가 있는 쪽지 묶음 id (보낸 사람 역할 기준)
    @Query("select distinct m.threadId from Message m "
            + "where m.threadId in :threadIds and m.senderRole = :senderRole and m.readAt is null")
    List<Long> findThreadIdsWithUnread(@Param("threadIds") Collection<Long> threadIds,
                                       @Param("senderRole") SenderRole senderRole);

    // 학습자가 아직 읽지 않은 이음쌤 답장 수(홈의 unreadMessages)
    @Query("select count(m) from Message m where m.senderRole = :sender and m.readAt is null "
            + "and m.threadId in (select t.id from MessageThread t where t.studentId = :studentId)")
    long countUnreadReplies(@Param("studentId") Long studentId, @Param("sender") SenderRole sender);
}
