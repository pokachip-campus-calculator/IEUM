package com.ieum.transfer.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.notification.service.NotificationService;
import com.ieum.transfer.dto.TransferCreateResponse;
import com.ieum.transfer.entity.TransferRequest;
import com.ieum.transfer.entity.TransferStatus;
import com.ieum.transfer.repository.TransferRequestRepository;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
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
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** [역할] 이관 신청(25)과 수락(26)의 권한, 중복 신청, 담당·쪽지 묶음 변경, 알림 대상을 DB 없이 확인한다. */
class TransferServiceTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 12, 10, 0);
    private static final long FROM = 2L, TO = 3L, STUDENT = 12L, REQUEST = 7L;

    private TransferRequestRepository requestRepository;
    private UserRepository userRepository;
    private MessageThreadRepository threadRepository;
    private NotificationService notificationService;
    private TransferService service;

    private User student;
    private User toTeacher;

    @BeforeEach
    void setUp() {
        requestRepository = mock(TransferRequestRepository.class);
        userRepository = mock(UserRepository.class);
        threadRepository = mock(MessageThreadRepository.class);
        notificationService = mock(NotificationService.class);
        service = new TransferService(requestRepository, userRepository, threadRepository, notificationService,
                Clock.fixed(NOW.atZone(SEOUL).toInstant(), SEOUL));

        student = user(STUDENT, Role.STUDENT, UserStatus.ACTIVE, "hana");
        student.assignTeacher(FROM, NOW.minusDays(3));
        toTeacher = user(TO, Role.TEACHER, UserStatus.ACTIVE, "teacher2");
        when(userRepository.findById(STUDENT)).thenReturn(Optional.of(student));
        when(userRepository.findByLoginId("teacher2")).thenReturn(Optional.of(toTeacher));
        when(requestRepository.save(any(TransferRequest.class))).thenAnswer(inv -> {
            TransferRequest r = inv.getArgument(0);
            ReflectionTestUtils.setField(r, "id", REQUEST);
            ReflectionTestUtils.setField(r, "createdAt", NOW);
            return r;
        });
    }

    private User user(long id, Role role, UserStatus status, String loginId) {
        User u = new User(loginId, "hash", role, status, "이름", "닉네임", NOW);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private TransferRequest pending() {
        TransferRequest r = new TransferRequest(STUDENT, FROM, TO);
        ReflectionTestUtils.setField(r, "id", REQUEST);
        return r;
    }

    // ---- 25 신청 ----

    @Test
    void 신청하면_PENDING_행이_생기고_받는_이음쌤에게만_알림이_간다() {
        TransferCreateResponse res = service.create(FROM, STUDENT, " Teacher2 ");   // 공백·대문자는 맞춰서 찾는다

        assertThat(res.id()).isEqualTo(REQUEST);
        assertThat(res.status()).isEqualTo(TransferStatus.PENDING);
        assertThat(res.createdAt().getOffset().getTotalSeconds()).isEqualTo(9 * 3600);
        ArgumentCaptor<TransferRequest> saved = ArgumentCaptor.forClass(TransferRequest.class);
        verify(requestRepository).save(saved.capture());
        assertThat(saved.getValue().getFromTeacherId()).isEqualTo(FROM);
        assertThat(saved.getValue().getToTeacherId()).isEqualTo(TO);
        verify(notificationService).transferRequested(TO, REQUEST);
        verify(notificationService, never()).transferAccepted(any(), any());
    }

    @Test
    void 내_담당이_아닌_학습자는_FORBIDDEN() {
        User other = user(99L, Role.STUDENT, UserStatus.ACTIVE, "other");
        other.assignTeacher(5L, NOW);
        when(userRepository.findById(99L)).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.create(FROM, 99L, "teacher2"))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
        verifyNoInteractions(notificationService);
    }

    @Test
    void 없는_학습자와_없는_이음쌤_아이디는_NOT_FOUND() {
        assertThatThrownBy(() -> service.create(FROM, 404L, "teacher2"))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        assertThatThrownBy(() -> service.create(FROM, STUDENT, "nobody"))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }

    @Test
    void 받는_사람이_학습자거나_활성이_아닌_이음쌤이면_NOT_FOUND() {
        when(userRepository.findByLoginId("kid")).thenReturn(Optional.of(user(40L, Role.STUDENT, UserStatus.ACTIVE, "kid")));
        when(userRepository.findByLoginId("gone")).thenReturn(Optional.of(user(41L, Role.TEACHER, UserStatus.PENDING_GUARDIAN, "gone")));

        assertThatThrownBy(() -> service.create(FROM, STUDENT, "kid"))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        assertThatThrownBy(() -> service.create(FROM, STUDENT, "gone"))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }

    @Test
    void 나_자신에게_신청하면_VALIDATION_FAILED() {
        when(userRepository.findByLoginId("me")).thenReturn(Optional.of(user(FROM, Role.TEACHER, UserStatus.ACTIVE, "me")));

        assertThatThrownBy(() -> service.create(FROM, STUDENT, "me"))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED));
    }

    @Test
    void 기다리는_신청이_이미_있으면_409() {
        when(requestRepository.existsByStudentIdAndStatus(STUDENT, TransferStatus.PENDING)).thenReturn(true);

        assertThatThrownBy(() -> service.create(FROM, STUDENT, "teacher2"))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.TRANSFER_ALREADY_PENDING));
        verify(requestRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    // ---- 26 수락 ----

    @Test
    void 수락하면_담당과_쪽지묶음이_바뀌고_신청한_이음쌤에게만_알림이_간다() {
        TransferRequest request = pending();
        MessageThread thread = new MessageThread(STUDENT, FROM, ThreadTopic.ONLINE, null);
        when(requestRepository.findById(REQUEST)).thenReturn(Optional.of(request));
        when(threadRepository.findByStudentId(STUDENT)).thenReturn(List.of(thread));

        service.accept(TO, REQUEST);

        assertThat(student.getTeacherId()).isEqualTo(TO);
        assertThat(student.getTeacherAssignedAt()).isEqualTo(NOW);
        assertThat(thread.getTeacherId()).isEqualTo(TO);
        assertThat(request.getStatus()).isEqualTo(TransferStatus.ACCEPTED);
        assertThat(request.getHandledAt()).isEqualTo(NOW);
        verify(notificationService).transferAccepted(FROM, REQUEST);
        verify(notificationService, never()).transferRequested(any(), any());
        verify(notificationService, never()).teacherAssigned(any());   // 학습자에게는 알림이 없다
    }

    @Test
    void 받는_이음쌤이_아니거나_없는_번호는_NOT_FOUND() {
        when(requestRepository.findById(REQUEST)).thenReturn(Optional.of(pending()));

        assertThatThrownBy(() -> service.accept(FROM, REQUEST))   // 신청한 사람은 수락할 수 없다
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        assertThatThrownBy(() -> service.accept(TO, 404L))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        assertThat(student.getTeacherId()).isEqualTo(FROM);
    }

    @Test
    void 이미_수락한_신청은_409이고_아무것도_바뀌지_않는다() {
        TransferRequest request = pending();
        request.accept(NOW.minusHours(1));
        when(requestRepository.findById(REQUEST)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.accept(TO, REQUEST))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.TRANSFER_NOT_PENDING));
        verifyNoInteractions(notificationService);
        verify(threadRepository, never()).findByStudentId(any());
    }

    @Test
    void 신청한_뒤_담당이_이미_바뀌었으면_409() {
        student.assignTeacher(5L, NOW.minusDays(1));   // 운영자가 ops.sql로 먼저 바꾼 경우
        when(requestRepository.findById(REQUEST)).thenReturn(Optional.of(pending()));

        assertThatThrownBy(() -> service.accept(TO, REQUEST))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.TRANSFER_NOT_PENDING));
        assertThat(student.getTeacherId()).isEqualTo(5L);
        verifyNoInteractions(notificationService);
    }
}
