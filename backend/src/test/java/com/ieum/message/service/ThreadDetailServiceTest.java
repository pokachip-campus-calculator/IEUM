package com.ieum.message.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.message.dto.SendMessageRequest;
import com.ieum.message.dto.SendMessageResponse;
import com.ieum.message.dto.ThreadDetailResponse;
import com.ieum.message.entity.Message;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.SenderRole;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.message.repository.MessageRepository;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.notification.service.NotificationService;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.signal.service.SignalCheckService;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** [역할] 쪽지 상세(14)·이어쓰기(15)의 접근 규칙, 읽음 처리, signal 노출, 상태 전환을 DB 없이 확인한다. */
class ThreadDetailServiceTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 4, 14, 0);
    private static final String CONTENT = "{\"choices\":[{\"id\":\"c1\",\"text\":\"이유를 묻는다\"},{\"id\":\"c2\",\"text\":\"사진을 보내 줌\"}]}";

    private UserRepository userRepository;
    private MessageThreadRepository threadRepository;
    private MessageRepository messageRepository;
    private PracticeRepository practiceRepository;
    private PracticeRecordRepository recordRepository;
    private SignalEventRepository signalEventRepository;
    private SignalCheckService signalCheckService;
    private NotificationService notificationService;
    private ThreadDetailService service;
    private MessageThread thread;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        threadRepository = mock(MessageThreadRepository.class);
        messageRepository = mock(MessageRepository.class);
        practiceRepository = mock(PracticeRepository.class);
        recordRepository = mock(PracticeRecordRepository.class);
        signalEventRepository = mock(SignalEventRepository.class);
        signalCheckService = mock(SignalCheckService.class);
        notificationService = mock(NotificationService.class);
        Clock clock = Clock.fixed(NOW.atZone(SEOUL).toInstant(), SEOUL);
        service = new ThreadDetailService(userRepository, threadRepository, messageRepository, practiceRepository,
                recordRepository, signalEventRepository, signalCheckService, notificationService,
                JsonMapper.builder().build(), clock);

        user(1L, Role.STUDENT);
        user(9L, Role.TEACHER);
        thread = new MessageThread(1L, 9L, ThreadTopic.ONLINE, null);
        ReflectionTestUtils.setField(thread, "id", 31L);
        ReflectionTestUtils.setField(thread, "createdAt", NOW.minusHours(4));
        ReflectionTestUtils.setField(thread, "lastMessageAt", NOW.minusHours(4));
        when(threadRepository.findById(31L)).thenReturn(Optional.of(thread));
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            ReflectionTestUtils.setField(m, "id", 102L);
            ReflectionTestUtils.setField(m, "createdAt", NOW);
            return m;
        });
    }

    private void user(long id, Role role) {
        User u = new User("user" + id, "hash", role, UserStatus.ACTIVE, "이름", "닉" + id, NOW);
        ReflectionTestUtils.setField(u, "id", id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
    }

    private Message message(long id, SenderRole role) {
        Message m = new Message(31L, role, "본문" + id);
        ReflectionTestUtils.setField(m, "id", id);
        ReflectionTestUtils.setField(m, "createdAt", NOW.minusHours(4));
        return m;
    }

    private SignalEvent signal(long id, long messageId) {
        SignalEvent e = new SignalEvent(1L, messageId, 3L, "죽고싶다");
        ReflectionTestUtils.setField(e, "id", id);
        return e;
    }

    // ---------- 14 접근 ----------

    @Test
    void 다른_학습자나_담당이_아닌_이음쌤은_FORBIDDEN() {
        user(2L, Role.STUDENT);
        user(8L, Role.TEACHER);

        for (long outsider : new long[]{2L, 8L}) {
            assertThatThrownBy(() -> service.detail(outsider, 31L))
                    .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
        }
        verify(messageRepository, never()).findByThreadIdOrderByIdAsc(anyLong());
    }

    @Test
    void 없는_쪽지는_NOT_FOUND() {
        when(threadRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.detail(1L, 404L))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }

    // ---------- 14 읽음·signal ----------

    @Test
    void 학습자가_열면_이음쌤_메시지만_읽음_처리하고_signal_키를_내리지_않는다() {
        Message mine = message(101L, SenderRole.STUDENT);
        Message reply = message(102L, SenderRole.TEACHER);
        when(messageRepository.findByThreadIdOrderByIdAsc(31L)).thenReturn(List.of(mine, reply));

        ThreadDetailResponse res = service.detail(1L, 31L);

        assertThat(reply.getReadAt()).isEqualTo(NOW);
        assertThat(mine.getReadAt()).isNull();
        assertThat(res.signal()).isNull();
        verify(signalEventRepository, never()).findByMessageIdIn(any());
        verify(notificationService, never()).noteRead(anyLong(), anyLong());
        assertThat(res.messages()).hasSize(2);
        assertThat(res.student().nickname()).isEqualTo("닉1");
        assertThat(res.teacher().nickname()).isEqualTo("닉9");
    }

    @Test
    void 이음쌤이_열면_학습자_메시지를_읽음_처리하고_signal을_내린다() {
        Message first = message(101L, SenderRole.STUDENT);
        Message reply = message(102L, SenderRole.TEACHER);
        when(messageRepository.findByThreadIdOrderByIdAsc(31L)).thenReturn(List.of(first, reply));
        when(signalEventRepository.findByMessageIdIn(List.of(101L))).thenReturn(List.of(signal(5L, 101L)));

        ThreadDetailResponse res = service.detail(9L, 31L);

        assertThat(first.getReadAt()).isEqualTo(NOW);
        assertThat(reply.getReadAt()).isNull();
        assertThat(res.signal().id()).isEqualTo(5L);
        assertThat(res.signal().status().name()).isEqualTo("OPEN");
        verify(notificationService).noteRead(1L, 31L);
    }

    @Test
    void 이미_읽은_쪽지를_다시_열면_읽은_시각을_덮어쓰지_않고_알림도_다시_안_만든다() {
        Message first = message(101L, SenderRole.STUDENT);
        first.markRead(NOW.minusHours(1));
        when(messageRepository.findByThreadIdOrderByIdAsc(31L)).thenReturn(List.of(first));

        service.detail(9L, 31L);

        assertThat(first.getReadAt()).isEqualTo(NOW.minusHours(1));
        verify(notificationService, never()).noteRead(anyLong(), anyLong());
    }

    // ---------- 14 pickedChoice ----------

    @Test
    void 연결_시나리오에서_학습자가_고른_선택지_문구를_내린다() {
        ReflectionTestUtils.setField(thread, "practiceId", 2L);
        Practice practice = mock(Practice.class);
        when(practice.getId()).thenReturn(2L);
        when(practice.getTitle()).thenReturn("온라인에서 받은 비밀 부탁");
        when(practice.getContentJson()).thenReturn(CONTENT);
        when(practiceRepository.findById(2L)).thenReturn(Optional.of(practice));
        when(recordRepository.findByUserIdAndPracticeId(1L, 2L))
                .thenReturn(Optional.of(new PracticeRecord(1L, 2L, "{\"choice\":\"c2\"}")));
        when(messageRepository.findByThreadIdOrderByIdAsc(31L)).thenReturn(List.of(message(101L, SenderRole.STUDENT)));

        ThreadDetailResponse res = service.detail(1L, 31L);

        assertThat(res.linkedPractice().title()).isEqualTo("온라인에서 받은 비밀 부탁");
        assertThat(res.linkedPractice().pickedChoice()).isEqualTo("사진을 보내 줌");
    }

    @Test
    void 고른_기록이_없으면_pickedChoice는_null이고_연결이_없으면_linkedPractice도_null() {
        when(messageRepository.findByThreadIdOrderByIdAsc(31L)).thenReturn(List.of());
        assertThat(service.detail(1L, 31L).linkedPractice()).isNull();

        ReflectionTestUtils.setField(thread, "practiceId", 2L);
        Practice practice = mock(Practice.class);
        when(practice.getId()).thenReturn(2L);
        when(practice.getTitle()).thenReturn("제목");
        when(practiceRepository.findById(2L)).thenReturn(Optional.of(practice));
        when(recordRepository.findByUserIdAndPracticeId(1L, 2L)).thenReturn(Optional.empty());

        assertThat(service.detail(1L, 31L).linkedPractice().pickedChoice()).isNull();
    }

    // ---------- 15 ----------

    @Test
    void 학습자가_이어쓰면_WAITING으로_바뀌고_신호_검사와_이음쌤_알림을_한다() {
        ReflectionTestUtils.setField(thread, "status", ThreadStatus.ANSWERED);

        SendMessageResponse res = service.send(1L, 31L, new SendMessageRequest("고마워요"));

        assertThat(res.id()).isEqualTo(102L);
        assertThat(res.senderRole()).isEqualTo(SenderRole.STUDENT);
        assertThat(res.createdAt().toString()).isEqualTo("2026-11-04T14:00+09:00");
        assertThat(thread.getStatus()).isEqualTo(ThreadStatus.WAITING);
        assertThat(thread.getLastMessageAt()).isEqualTo(NOW);
        verify(signalCheckService).check(any(Message.class), eq(1L), eq(9L));
        verify(notificationService).noteReceived(9L, 31L);
    }

    @Test
    void 이음쌤이_답하면_ANSWERED로_바뀌고_신호_검사는_하지_않는다() {
        SendMessageResponse res = service.send(9L, 31L, new SendMessageRequest("어떤 마음이에요?"));

        assertThat(res.senderRole()).isEqualTo(SenderRole.TEACHER);
        assertThat(thread.getStatus()).isEqualTo(ThreadStatus.ANSWERED);
        assertThat(thread.getLastMessageAt()).isEqualTo(NOW);
        verify(signalCheckService, never()).check(any(), anyLong(), anyLong());
        verify(notificationService).replyArrived(1L, 31L);
    }

    @Test
    void 접근할_수_없는_쪽지에는_보낼_수_없다() {
        user(2L, Role.STUDENT);

        assertThatThrownBy(() -> service.send(2L, 31L, new SendMessageRequest("안녕")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
        verify(messageRepository, never()).save(any());
    }
}
