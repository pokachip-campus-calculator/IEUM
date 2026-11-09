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
import com.ieum.message.repository.MessageRepository;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.notification.service.NotificationService;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.signal.service.SignalCheckService;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * [역할] 학습자의 쪽지 보내기(12)와 내 쪽지함(13)을 처리하고, 첫 쪽지 때 담당 이음쌤을 자동 배정한다.
 * [동작] 12는 한 트랜잭션에서 배정 → 쪽지 묶음·첫 메시지 저장 → 신호 검사 → 알림 생성을 한다. 13은 목록을 묶음 쿼리로 모아 만든다.
 * [연결] ThreadController가 부른다 / UserRepository, MessageThreadRepository, MessageRepository, PracticeRepository, SignalCheckService, NotificationService
 * [주의] 이음쌤이 없으면 NO_TEACHER_AVAILABLE로 롤백되어 아무것도 저장되지 않는다. 신호 검사 결과는 응답에 넣지 않는다.
 */
@Service
public class ThreadService {

    private static final int PREVIEW_LENGTH = 40;

    private final UserRepository userRepository;
    private final MessageThreadRepository threadRepository;
    private final MessageRepository messageRepository;
    private final PracticeRepository practiceRepository;
    private final SignalCheckService signalCheckService;
    private final NotificationService notificationService;
    private final Clock clock;

    public ThreadService(UserRepository userRepository, MessageThreadRepository threadRepository,
                         MessageRepository messageRepository, PracticeRepository practiceRepository,
                         SignalCheckService signalCheckService, NotificationService notificationService, Clock clock) {
        this.userRepository = userRepository;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.practiceRepository = practiceRepository;
        this.signalCheckService = signalCheckService;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    @Transactional
    public CreateThreadResponse create(Long userId, CreateThreadRequest req) {
        User student = findStudent(userId);

        if (req.practiceId() != null && !practiceRepository.existsById(req.practiceId())) {
            throw ApiException.invalid("practiceId", "연결할 연습을 찾을 수 없어요.");
        }

        // 첫 쪽지면 담당 이음쌤을 정한다. 한 명도 없으면 여기서 멈춰 아무것도 저장되지 않는다
        boolean newlyAssigned = student.getTeacherId() == null;
        if (newlyAssigned) {
            User teacher = userRepository.findLeastLoadedTeacher()
                    .orElseThrow(() -> new ApiException(ErrorCode.NO_TEACHER_AVAILABLE));
            student.assignTeacher(teacher.getId(), LocalDateTime.now(clock));
        }
        Long teacherId = student.getTeacherId();

        MessageThread thread = threadRepository.save(new MessageThread(student.getId(), teacherId, req.topic(), req.practiceId()));
        Message message = messageRepository.save(new Message(thread.getId(), SenderRole.STUDENT, req.body()));

        signalCheckService.check(message, student.getId(), teacherId);
        notificationService.noteReceived(teacherId, thread.getId());
        if (newlyAssigned) {
            notificationService.teacherAssigned(student.getId());
            notificationService.learnerAssigned(teacherId, thread.getId());
        }

        return new CreateThreadResponse(thread.getId(), thread.getStatus(), toOffset(thread.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public ThreadListResponse list(Long userId, ThreadStatus status) {
        User student = findStudent(userId);
        List<MessageThread> threads = (status == null)
                ? threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(student.getId())
                : threadRepository.findByStudentIdAndStatusOrderByLastMessageAtDescIdDesc(student.getId(), status);
        if (threads.isEmpty()) {
            return new ThreadListResponse(List.of());
        }

        List<Long> threadIds = threads.stream().map(MessageThread::getId).toList();
        Map<Long, Message> firstMessages = messageRepository.findFirstMessages(threadIds).stream()
                .collect(Collectors.toMap(Message::getThreadId, Function.identity()));
        Set<Long> unreadThreadIds = new HashSet<>(messageRepository.findThreadIdsWithUnread(threadIds, SenderRole.TEACHER));

        List<Long> practiceIds = threads.stream().map(MessageThread::getPracticeId).filter(id -> id != null).distinct().toList();
        Map<Long, String> practiceTitles = practiceIds.isEmpty() ? Map.of()
                : practiceRepository.findAllById(practiceIds).stream()
                        .collect(Collectors.toMap(Practice::getId, Practice::getTitle));

        List<ThreadListResponse.Item> items = threads.stream().map(t -> {
            Message first = firstMessages.get(t.getId());
            String title = t.getPracticeId() == null ? null : practiceTitles.get(t.getPracticeId());
            return new ThreadListResponse.Item(
                    t.getId(), t.getTopic(), t.getStatus(),
                    toOffset(t.getCreatedAt()), toOffset(t.getLastMessageAt()),
                    first == null ? "" : preview(first.getBody()),
                    unreadThreadIds.contains(t.getId()),
                    title == null ? null : new ThreadListResponse.LinkedPractice(t.getPracticeId(), title));
        }).toList();
        return new ThreadListResponse(items);
    }

    // 쪽지는 학습자만 쓴다. 토큰은 맞는데 이미 탈퇴한 계정이면 로그인이 풀린 것으로 본다
    private User findStudent(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
        if (user.getRole() != Role.STUDENT) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return user;
    }

    // 글자(이모지 포함) 단위로 앞 40자만 자른다
    private String preview(String body) {
        if (body.codePointCount(0, body.length()) <= PREVIEW_LENGTH) {
            return body;
        }
        return body.substring(0, body.offsetByCodePoints(0, PREVIEW_LENGTH));
    }

    // 저장된 한국 시각에 +09:00을 붙여 응답 규약(ISO-8601)에 맞춘다
    private OffsetDateTime toOffset(LocalDateTime time) {
        return time.atZone(clock.getZone()).toOffsetDateTime();
    }
}
