package com.ieum.message.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.message.dto.CreateThreadRequest;
import com.ieum.message.dto.CreateThreadResponse;
import com.ieum.message.dto.ThreadListResponse;
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
import com.ieum.signal.service.SignalCheckService;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** [역할] 쪽지 보내기·내 쪽지함(12·13)과 이음쌤 자동 배정 규칙을 DB 없이 확인한다. */
class ThreadServiceTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 4, 10, 30);

    private UserRepository userRepository;
    private MessageThreadRepository threadRepository;
    private MessageRepository messageRepository;
    private PracticeRepository practiceRepository;
    private SignalCheckService signalCheckService;
    private NotificationService notificationService;
    private ThreadService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        threadRepository = mock(MessageThreadRepository.class);
        messageRepository = mock(MessageRepository.class);
        practiceRepository = mock(PracticeRepository.class);
        signalCheckService = mock(SignalCheckService.class);
        notificationService = mock(NotificationService.class);
        Clock clock = Clock.fixed(NOW.atZone(SEOUL).toInstant(), SEOUL);
        service = new ThreadService(userRepository, threadRepository, messageRepository, practiceRepository,
                signalCheckService, notificationService, clock);

        // 저장하면 DB처럼 id와 시각이 채워진 채로 돌아온다
        when(threadRepository.save(any(MessageThread.class))).thenAnswer(inv -> {
            MessageThread t = inv.getArgument(0);
            ReflectionTestUtils.setField(t, "id", 31L);
            ReflectionTestUtils.setField(t, "createdAt", NOW);
            ReflectionTestUtils.setField(t, "lastMessageAt", NOW);
            return t;
        });
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            ReflectionTestUtils.setField(m, "id", 101L);
            return m;
        });
    }

    private User user(long id, Role role) {
        User u = new User("user" + id, "hash", role, UserStatus.ACTIVE, "이름", "닉" + id, NOW);
        ReflectionTestUtils.setField(u, "id", id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        return u;
    }

    // when(...) 안쪽에서 또 when을 부르면 Mockito가 깨지므로, 이음쌤은 저장소 stubbing 없이 만든다
    private User teacher() {
        User u = new User("user9", "hash", Role.TEACHER, UserStatus.ACTIVE, "이름", "닉9", NOW);
        ReflectionTestUtils.setField(u, "id", 9L);
        return u;
    }

    private CreateThreadRequest request(Long practiceId) {
        return new CreateThreadRequest(ThreadTopic.ONLINE, "게임에서 알게 된 사람이 사진을 보내 달래요", practiceId);
    }

    // ---------- 12 보내기 ----------

    @Test
    void 첫_쪽지면_학습자가_가장_적은_이음쌤을_배정하고_배정_시각을_기록한다() {
        User student = user(1L, Role.STUDENT);
        User teacher = user(9L, Role.TEACHER);
        when(userRepository.findLeastLoadedTeacher()).thenReturn(Optional.of(teacher));

        CreateThreadResponse res = service.create(1L, request(null));

        assertThat(student.getTeacherId()).isEqualTo(9L);
        assertThat(student.getTeacherAssignedAt()).isEqualTo(NOW);
        assertThat(res.id()).isEqualTo(31L);
        assertThat(res.status()).isEqualTo(ThreadStatus.WAITING);
        assertThat(res.createdAt().toString()).isEqualTo("2026-11-04T10:30+09:00");
    }

    @Test
    void 쪽지_묶음은_WAITING으로_첫_메시지는_학습자_메시지로_함께_저장된다() {
        user(1L, Role.STUDENT);
        when(userRepository.findLeastLoadedTeacher()).thenReturn(Optional.of(teacher()));

        when(practiceRepository.existsById(8L)).thenReturn(true);

        service.create(1L, request(8L));

        var threadCaptor = org.mockito.ArgumentCaptor.forClass(MessageThread.class);
        verify(threadRepository).save(threadCaptor.capture());
        assertThat(threadCaptor.getValue().getStatus()).isEqualTo(ThreadStatus.WAITING);
        assertThat(threadCaptor.getValue().getStudentId()).isEqualTo(1L);
        assertThat(threadCaptor.getValue().getTeacherId()).isEqualTo(9L);
        assertThat(threadCaptor.getValue().getTopic()).isEqualTo(ThreadTopic.ONLINE);
        assertThat(threadCaptor.getValue().getPracticeId()).isEqualTo(8L);

        var messageCaptor = org.mockito.ArgumentCaptor.forClass(Message.class);
        verify(messageRepository).save(messageCaptor.capture());
        assertThat(messageCaptor.getValue().getThreadId()).isEqualTo(31L);
        assertThat(messageCaptor.getValue().getSenderRole()).isEqualTo(SenderRole.STUDENT);
        assertThat(messageCaptor.getValue().getBody()).isEqualTo("게임에서 알게 된 사람이 사진을 보내 달래요");
    }

    @Test
    void 이미_담당_이음쌤이_있으면_다시_배정하지_않는다() {
        User student = user(1L, Role.STUDENT);
        student.assignTeacher(7L, NOW.minusDays(3));

        service.create(1L, request(null));

        verify(userRepository, never()).findLeastLoadedTeacher();
        assertThat(student.getTeacherId()).isEqualTo(7L);
        assertThat(student.getTeacherAssignedAt()).isEqualTo(NOW.minusDays(3));
        var captor = org.mockito.ArgumentCaptor.forClass(MessageThread.class);
        verify(threadRepository).save(captor.capture());
        assertThat(captor.getValue().getTeacherId()).isEqualTo(7L);
    }

    @Test
    void 이음쌤이_한_명도_없으면_NO_TEACHER_AVAILABLE이고_아무것도_저장하지_않는다() {
        user(1L, Role.STUDENT);
        when(userRepository.findLeastLoadedTeacher()).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(1L, request(null)))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getErrorCode())
                .isEqualTo(ErrorCode.NO_TEACHER_AVAILABLE);

        verify(threadRepository, never()).save(any());
        verify(messageRepository, never()).save(any());
        verify(signalCheckService, never()).check(any(), anyLong(), anyLong());
        verify(notificationService, never()).noteReceived(anyLong(), anyLong());
    }

    @Test
    void 신호_검사와_알림_생성이_저장한_뒤_같은_흐름에서_불린다() {
        user(1L, Role.STUDENT);
        when(userRepository.findLeastLoadedTeacher()).thenReturn(Optional.of(teacher()));

        service.create(1L, request(null));

        var captor = org.mockito.ArgumentCaptor.forClass(Message.class);
        verify(signalCheckService).check(captor.capture(), org.mockito.ArgumentMatchers.eq(1L), org.mockito.ArgumentMatchers.eq(9L));
        assertThat(captor.getValue().getId()).isEqualTo(101L);   // 저장된 메시지를 검사한다
        verify(notificationService).noteReceived(9L, 31L);
        verify(notificationService).teacherAssigned(1L);
        verify(notificationService).learnerAssigned(9L, 31L);
    }

    @Test
    void 이미_배정된_학습자의_쪽지는_배정_알림_없이_새_쪽지_알림만_만든다() {
        User student = user(1L, Role.STUDENT);
        student.assignTeacher(7L, NOW.minusDays(1));

        service.create(1L, request(null));

        verify(notificationService).noteReceived(7L, 31L);
        verify(notificationService, never()).teacherAssigned(anyLong());
        verify(notificationService, never()).learnerAssigned(anyLong(), anyLong());
    }

    @Test
    void 없는_practiceId면_VALIDATION_FAILED이고_배정도_하지_않는다() {
        User student = user(1L, Role.STUDENT);
        when(practiceRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> service.create(1L, request(999L)))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException ex = (ApiException) e;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                    assertThat(ex.getFieldErrors().get(0).field()).isEqualTo("practiceId");
                });

        assertThat(student.getTeacherId()).isNull();
        verify(threadRepository, never()).save(any());
    }

    @Test
    void 이음쌤이_쪽지를_보내려_하면_FORBIDDEN() {
        user(9L, Role.TEACHER);

        assertThatThrownBy(() -> service.create(9L, request(null)))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
        verify(threadRepository, never()).save(any());
    }

    @Test
    void 탈퇴한_계정이면_UNAUTHORIZED() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(1L, request(null)))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getErrorCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED);
    }

    // ---------- 13 목록 ----------

    private MessageThread thread(long id, ThreadStatus status, Long practiceId, LocalDateTime last) {
        MessageThread t = new MessageThread(1L, 9L, ThreadTopic.ONLINE, practiceId);
        ReflectionTestUtils.setField(t, "id", id);
        ReflectionTestUtils.setField(t, "createdAt", NOW.minusDays(1));
        ReflectionTestUtils.setField(t, "lastMessageAt", last);
        ReflectionTestUtils.setField(t, "status", status);
        return t;
    }

    private Message firstMessage(long threadId, String body) {
        Message m = new Message(threadId, SenderRole.STUDENT, body);
        ReflectionTestUtils.setField(m, "id", threadId * 10);
        return m;
    }

    private Practice practice(long id, String title) {
        Practice p = mock(Practice.class);
        when(p.getId()).thenReturn(id);
        when(p.getTitle()).thenReturn(title);
        return p;
    }

    @Test
    void 쪽지가_없으면_빈_items() {
        user(1L, Role.STUDENT);
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L)).thenReturn(List.of());

        assertThat(service.list(1L, null).items()).isEmpty();
        verify(messageRepository, never()).findFirstMessages(any());
    }

    @Test
    void 목록은_저장소가_준_최신_순을_그대로_내리고_상태_필터는_저장소에_넘긴다() {
        user(1L, Role.STUDENT);
        when(threadRepository.findByStudentIdAndStatusOrderByLastMessageAtDescIdDesc(1L, ThreadStatus.ANSWERED))
                .thenReturn(List.of(thread(2L, ThreadStatus.ANSWERED, null, NOW), thread(1L, ThreadStatus.ANSWERED, null, NOW.minusHours(5))));
        when(messageRepository.findFirstMessages(any())).thenReturn(List.of(firstMessage(1L, "a"), firstMessage(2L, "b")));
        when(messageRepository.findThreadIdsWithUnread(any(), org.mockito.ArgumentMatchers.eq(SenderRole.TEACHER))).thenReturn(List.of());

        ThreadListResponse res = service.list(1L, ThreadStatus.ANSWERED);

        assertThat(res.items()).extracting(ThreadListResponse.Item::id).containsExactly(2L, 1L);
        verify(threadRepository, never()).findByStudentIdOrderByLastMessageAtDescIdDesc(anyLong());
    }

    @Test
    void preview는_첫_쪽지_앞_40자이고_짧으면_그대로다() {
        user(1L, Role.STUDENT);
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L))
                .thenReturn(List.of(thread(1L, ThreadStatus.WAITING, null, NOW), thread(2L, ThreadStatus.WAITING, null, NOW)));
        when(messageRepository.findFirstMessages(any())).thenReturn(List.of(
                firstMessage(1L, "가".repeat(45)), firstMessage(2L, "짧은 쪽지")));
        when(messageRepository.findThreadIdsWithUnread(any(), any())).thenReturn(List.of());

        List<ThreadListResponse.Item> items = service.list(1L, null).items();

        assertThat(items.get(0).preview()).isEqualTo("가".repeat(40));
        assertThat(items.get(1).preview()).isEqualTo("짧은 쪽지");
    }

    @Test
    void preview는_이모지를_반으로_자르지_않는다() {
        user(1L, Role.STUDENT);
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L))
                .thenReturn(List.of(thread(1L, ThreadStatus.WAITING, null, NOW)));
        when(messageRepository.findFirstMessages(any())).thenReturn(List.of(firstMessage(1L, "😀".repeat(41))));
        when(messageRepository.findThreadIdsWithUnread(any(), any())).thenReturn(List.of());

        assertThat(service.list(1L, null).items().get(0).preview()).isEqualTo("😀".repeat(40));
    }

    @Test
    void unread는_안_읽은_이음쌤_메시지가_있는_쪽지만_true() {
        user(1L, Role.STUDENT);
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L))
                .thenReturn(List.of(thread(1L, ThreadStatus.ANSWERED, null, NOW), thread(2L, ThreadStatus.WAITING, null, NOW)));
        when(messageRepository.findFirstMessages(any())).thenReturn(List.of(firstMessage(1L, "a"), firstMessage(2L, "b")));
        when(messageRepository.findThreadIdsWithUnread(any(), org.mockito.ArgumentMatchers.eq(SenderRole.TEACHER))).thenReturn(List.of(1L));

        List<ThreadListResponse.Item> items = service.list(1L, null).items();

        assertThat(items.get(0).unread()).isTrue();
        assertThat(items.get(1).unread()).isFalse();
    }

    @Test
    void linkedPractice는_연결된_시나리오가_없으면_null이고_있으면_id와_제목이다() {
        user(1L, Role.STUDENT);
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L))
                .thenReturn(List.of(thread(1L, ThreadStatus.WAITING, 8L, NOW), thread(2L, ThreadStatus.WAITING, null, NOW)));
        when(messageRepository.findFirstMessages(any())).thenReturn(List.of(firstMessage(1L, "a"), firstMessage(2L, "b")));
        when(messageRepository.findThreadIdsWithUnread(any(), any())).thenReturn(List.of());
        Practice scenario = practice(8L, "온라인에서 받은 비밀 부탁");
        when(practiceRepository.findAllById(List.of(8L))).thenReturn(List.of(scenario));

        List<ThreadListResponse.Item> items = service.list(1L, null).items();

        assertThat(items.get(0).linkedPractice().id()).isEqualTo(8L);
        assertThat(items.get(0).linkedPractice().title()).isEqualTo("온라인에서 받은 비밀 부탁");
        assertThat(items.get(1).linkedPractice()).isNull();
    }

    @Test
    void 시각은_한국_시간_오프셋을_붙여_내린다() {
        user(1L, Role.STUDENT);
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L))
                .thenReturn(List.of(thread(1L, ThreadStatus.WAITING, null, NOW)));
        when(messageRepository.findFirstMessages(any())).thenReturn(List.of(firstMessage(1L, "a")));
        when(messageRepository.findThreadIdsWithUnread(any(), any())).thenReturn(List.of());

        ThreadListResponse.Item item = service.list(1L, null).items().get(0);

        assertThat(item.lastMessageAt().toString()).isEqualTo("2026-11-04T10:30+09:00");
        assertThat(item.createdAt().toString()).isEqualTo("2026-11-03T10:30+09:00");
    }

    @Test
    void 이음쌤이_쪽지함을_부르면_FORBIDDEN() {
        user(9L, Role.TEACHER);

        assertThatThrownBy(() -> service.list(9L, null))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
    }
}
