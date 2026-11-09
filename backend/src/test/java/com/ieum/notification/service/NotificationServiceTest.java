package com.ieum.notification.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.notification.dto.NotificationListResponse;
import com.ieum.notification.entity.LinkType;
import com.ieum.notification.entity.Notification;
import com.ieum.notification.entity.NotificationType;
import com.ieum.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** [역할] 알림 생성 6종의 받는 사람·고정 문구·이동 위치와 목록·읽음(22~24) 규칙을 DB 없이 확인한다. */
class NotificationServiceTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 9, 10, 0);

    private NotificationRepository repository;
    private NotificationService service;

    @BeforeEach
    void setUp() {
        repository = mock(NotificationRepository.class);
        service = new NotificationService(repository, Clock.fixed(NOW.atZone(SEOUL).toInstant(), SEOUL));
    }

    private Notification saved() {
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }

    private void assertNoPrivateText(Notification n) {
        // 제목·본문은 고정 문구라 숫자(쪽지·신호 번호)나 낱말이 섞이지 않는다
        assertThat(n.getTitle() + n.getBody()).doesNotContainPattern("[0-9]");
    }

    @Test
    void 쪽지가_오면_담당_이음쌤에게_쪽지_묶음으로_연결한다() {
        service.noteReceived(9L, 31L);

        Notification n = saved();
        assertThat(n.getUserId()).isEqualTo(9L);
        assertThat(n.getType()).isEqualTo(NotificationType.NOTE_RECEIVED);
        assertThat(n.getLinkType()).isEqualTo(LinkType.THREAD);
        assertThat(n.getLinkId()).isEqualTo(31L);
        assertThat(n.isRead()).isFalse();
        assertNoPrivateText(n);
    }

    @Test
    void 신호는_이음쌤에게만_그_신호로_연결한다() {
        service.signalFlagged(9L, 500L);

        Notification n = saved();
        assertThat(n.getUserId()).isEqualTo(9L);
        assertThat(n.getType()).isEqualTo(NotificationType.SIGNAL_FLAGGED);
        assertThat(n.getLinkType()).isEqualTo(LinkType.SIGNAL);
        assertThat(n.getLinkId()).isEqualTo(500L);
        assertNoPrivateText(n);
    }

    @Test
    void 읽음_답장_알림은_학습자에게_쪽지_묶음으로_연결한다() {
        service.noteRead(1L, 31L);
        service.replyArrived(1L, 31L);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(repository, org.mockito.Mockito.times(2)).save(captor.capture());
        List<Notification> all = captor.getAllValues();
        assertThat(all).extracting(Notification::getType)
                .containsExactly(NotificationType.NOTE_READ, NotificationType.REPLY_ARRIVED);
        assertThat(all).allSatisfy(n -> {
            assertThat(n.getUserId()).isEqualTo(1L);
            assertThat(n.getLinkType()).isEqualTo(LinkType.THREAD);
            assertThat(n.getLinkId()).isEqualTo(31L);
        });
    }

    @Test
    void 이음쌤_배정은_학습자에게_내_정보로_연결하고_번호는_없다() {
        service.teacherAssigned(1L);

        Notification n = saved();
        assertThat(n.getUserId()).isEqualTo(1L);
        assertThat(n.getType()).isEqualTo(NotificationType.TEACHER_ASSIGNED);
        assertThat(n.getLinkType()).isEqualTo(LinkType.PROFILE);
        assertThat(n.getLinkId()).isNull();
    }

    @Test
    void 학습자_배정은_이음쌤에게_쪽지_묶음으로_연결한다() {
        service.learnerAssigned(9L, 31L);

        Notification n = saved();
        assertThat(n.getUserId()).isEqualTo(9L);
        assertThat(n.getType()).isEqualTo(NotificationType.LEARNER_ASSIGNED);
        assertThat(n.getLinkType()).isEqualTo(LinkType.THREAD);
        assertThat(n.getLinkId()).isEqualTo(31L);
    }

    private Notification existing(long id, long userId, boolean read) {
        Notification n = new Notification(userId, NotificationType.REPLY_ARRIVED, "제목", "본문", LinkType.THREAD, 7L);
        ReflectionTestUtils.setField(n, "id", id);
        ReflectionTestUtils.setField(n, "createdAt", LocalDateTime.of(2026, 11, 2, 9, 12));
        if (read) {
            n.markRead(NOW.minusDays(1));
        }
        return n;
    }

    @Test
    void 목록은_본인_알림과_전체_안읽음_수를_준다() {
        when(repository.findTop50ByUserIdOrderByCreatedAtDescIdDesc(1L))
                .thenReturn(List.of(existing(41, 1, false), existing(40, 1, true)));
        when(repository.countByUserIdAndReadFalse(1L)).thenReturn(3L);

        NotificationListResponse res = service.list(1L, false);

        assertThat(res.unreadCount()).isEqualTo(3L);
        assertThat(res.items()).hasSize(2);
        NotificationListResponse.Item first = res.items().get(0);
        assertThat(first.id()).isEqualTo(41L);
        assertThat(first.isRead()).isFalse();
        assertThat(first.createdAt().toString()).isEqualTo("2026-11-02T09:12+09:00");
    }

    @Test
    void unread만_보면_안_읽은_알림_조회를_쓴다() {
        when(repository.findTop50ByUserIdAndReadFalseOrderByCreatedAtDescIdDesc(1L))
                .thenReturn(List.of(existing(41, 1, false)));

        NotificationListResponse res = service.list(1L, true);

        assertThat(res.items()).hasSize(1);
        verify(repository, never()).findTop50ByUserIdOrderByCreatedAtDescIdDesc(any());
    }

    @Test
    void 안_읽은_알림을_읽으면_읽은_시각이_채워진다() {
        Notification n = existing(41, 1, false);
        when(repository.findByIdAndUserId(41L, 1L)).thenReturn(Optional.of(n));

        service.markRead(1L, 41L);

        assertThat(n.isRead()).isTrue();
        assertThat(n.getReadAt()).isEqualTo(NOW);
    }

    @Test
    void 이미_읽은_알림은_읽은_시각을_바꾸지_않는다() {
        Notification n = existing(40, 1, true);
        LocalDateTime before = n.getReadAt();
        when(repository.findByIdAndUserId(40L, 1L)).thenReturn(Optional.of(n));

        service.markRead(1L, 40L);

        assertThat(n.getReadAt()).isEqualTo(before);
    }

    @Test
    void 남의_알림이거나_없는_id면_NOT_FOUND다() {
        when(repository.findByIdAndUserId(41L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead(2L, 41L))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void 모두_읽음은_바뀐_개수를_준다() {
        when(repository.markAllRead(1L, NOW)).thenReturn(3);

        assertThat(service.markAllRead(1L).updated()).isEqualTo(3);
    }
}
