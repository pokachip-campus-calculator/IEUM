package com.ieum.notification.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.notification.dto.NotificationListResponse;
import com.ieum.notification.dto.ReadAllResponse;
import com.ieum.notification.entity.LinkType;
import com.ieum.notification.entity.Notification;
import com.ieum.notification.entity.NotificationType;
import com.ieum.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * [역할] 알림 목록·읽음(22~24)을 처리하고, 쪽지·신호·배정이 일어날 때 알림 행을 만든다.
 * [동작] 생성 메서드는 받는 사람·종류·고정 문구·이동할 곳을 정해 저장만 한다. 조회·읽음은 토큰의 사용자 본인 알림만 다룬다.
 * [연결] ThreadService·ThreadDetailService·SignalCheckService가 쪽지를 저장한 같은 트랜잭션에서 부른다 / NotificationRepository
 * [주의] 제목·본문은 서버가 정한 문구만 쓰고 쪽지 내용·찾은 낱말은 절대 넣지 않는다. SIGNAL_FLAGGED는 이음쌤에게만 만든다.
 */
@Service
public class NotificationService {

    private final NotificationRepository repository;
    private final Clock clock;

    public NotificationService(NotificationRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    // ---- 생성: 호출한 쪽의 트랜잭션에 합류하므로 쪽지 저장이 실패하면 알림도 남지 않는다 ----

    // NOTE_RECEIVED: 담당 이음쌤에게 "새 쪽지가 도착했어요" (누르면 쪽지 묶음)
    @Transactional
    public void noteReceived(Long teacherId, Long threadId) {
        create(teacherId, NotificationType.NOTE_RECEIVED, "새 쪽지가 도착했어요",
                "쪽지 모아 보기에서 확인해 보세요", LinkType.THREAD, threadId);
    }

    // SIGNAL_FLAGGED: 담당 이음쌤에게만 "확인이 필요한 쪽지가 있어요" (누르면 그 신호). 학습자에게는 만들지 않는다
    @Transactional
    public void signalFlagged(Long teacherId, Long signalId) {
        create(teacherId, NotificationType.SIGNAL_FLAGGED, "확인이 필요한 쪽지가 있어요",
                "신호 목록에서 확인해 보세요", LinkType.SIGNAL, signalId);
    }

    // NOTE_READ: 학습자에게 "이음쌤이 쪽지를 읽었어요" (누르면 쪽지 묶음)
    @Transactional
    public void noteRead(Long studentId, Long threadId) {
        create(studentId, NotificationType.NOTE_READ, "이음쌤이 쪽지를 읽었어요",
                "쪽지함에서 확인해 보세요", LinkType.THREAD, threadId);
    }

    // REPLY_ARRIVED: 학습자에게 "이음쌤의 답이 도착했어요" (누르면 쪽지 묶음)
    @Transactional
    public void replyArrived(Long studentId, Long threadId) {
        create(studentId, NotificationType.REPLY_ARRIVED, "이음쌤의 답장이 도착했어요",
                "쪽지함에서 확인해 보세요", LinkType.THREAD, threadId);
    }

    // TEACHER_ASSIGNED: 학습자에게 "담당 이음쌤이 정해졌어요" (누르면 내 정보, 이동 대상 번호 없음)
    @Transactional
    public void teacherAssigned(Long studentId) {
        create(studentId, NotificationType.TEACHER_ASSIGNED, "담당 이음쌤이 정해졌어요",
                "내 정보에서 확인해 보세요", LinkType.PROFILE, null);
    }

    // LEARNER_ASSIGNED: 이음쌤에게 "새 학습자가 배정됐어요" (누르면 쪽지 묶음)
    @Transactional
    public void learnerAssigned(Long teacherId, Long threadId) {
        create(teacherId, NotificationType.LEARNER_ASSIGNED, "새 학습자가 배정됐어요",
                "쪽지 모아 보기에서 확인해 보세요", LinkType.THREAD, threadId);
    }

    private void create(Long userId, NotificationType type, String title, String body, LinkType linkType, Long linkId) {
        repository.save(new Notification(userId, type, title, body, linkType, linkId));
    }

    // ---- 조회·읽음(22~24) ----

    // 22: 본인 알림만 최신순 최대 50건. unreadOnly면 안 읽은 것만. unreadCount는 항상 전체 안 읽음 수
    @Transactional(readOnly = true)
    public NotificationListResponse list(Long userId, boolean unreadOnly) {
        List<Notification> found = unreadOnly
                ? repository.findTop50ByUserIdAndReadFalseOrderByCreatedAtDescIdDesc(userId)
                : repository.findTop50ByUserIdOrderByCreatedAtDescIdDesc(userId);
        long unreadCount = repository.countByUserIdAndReadFalse(userId);
        return new NotificationListResponse(unreadCount, found.stream().map(this::toItem).toList());
    }

    // 23: 이미 읽은 알림은 그대로 두고, 남의 알림·없는 id는 구분 없이 NOT_FOUND
    @Transactional
    public void markRead(Long userId, Long id) {
        Notification n = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!n.isRead()) {
            n.markRead(LocalDateTime.now(clock));
        }
    }

    // 24: 내 안 읽은 알림을 모두 읽음으로 바꾸고 바뀐 개수를 돌려준다
    @Transactional
    public ReadAllResponse markAllRead(Long userId) {
        return new ReadAllResponse(repository.markAllRead(userId, LocalDateTime.now(clock)));
    }

    private NotificationListResponse.Item toItem(Notification n) {
        OffsetDateTime created = n.getCreatedAt().atZone(clock.getZone()).toOffsetDateTime();
        return new NotificationListResponse.Item(n.getId(), n.getType(), n.getTitle(), n.getBody(),
                n.getLinkType(), n.getLinkId(), n.isRead(), created);
    }
}
