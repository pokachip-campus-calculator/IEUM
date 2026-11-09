package com.ieum.message.service;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.message.entity.Message;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.SenderRole;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.notification.entity.Notification;
import com.ieum.notification.entity.NotificationType;
import com.ieum.notification.entity.LinkType;
import com.ieum.notification.repository.NotificationRepository;
import com.ieum.message.repository.MessageRepository;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ThreadService {

    private static final int BODY_MAX = 500;

    private final MessageThreadRepository threadRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final PracticeRepository practiceRepository;
    private final NotificationRepository notificationRepository;
    private final Clock clock;

    public ThreadService(MessageThreadRepository threadRepository, MessageRepository messageRepository,
                         UserRepository userRepository, PracticeRepository practiceRepository,
                         NotificationRepository notificationRepository, Clock clock) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.practiceRepository = practiceRepository;
        this.notificationRepository = notificationRepository;
        this.clock = clock;
    }

    @Transactional
    public CreatedThread create(AuthUser principal, String topicValue, String body, Long practiceId) {
        requireRole(principal, Role.STUDENT);
        ThreadTopic topic = parseTopic(topicValue);
        validateBody(body);
        User student = findUser(principal.id());
        User teacher = assignedTeacher(student);
        LocalDateTime now = LocalDateTime.now(clock);

        MessageThread thread = threadRepository.saveAndFlush(
                new MessageThread(student.getId(), teacher.getId(), topic, validPracticeId(practiceId)));
        messageRepository.saveAndFlush(new Message(thread.getId(), SenderRole.STUDENT, body.strip()));
        notificationRepository.save(new Notification(teacher.getId(), NotificationType.NOTE_RECEIVED,
                "새 쪽지가 도착했어요", "쪽지 모아 보기에서 확인해 보세요", LinkType.THREAD, thread.getId()));
        return new CreatedThread(thread.getId(), thread.getStatus(), toOffset(now));
    }

    @Transactional(readOnly = true)
    public ThreadList list(AuthUser principal, String statusValue) {
        requireRole(principal, Role.STUDENT);
        ThreadStatus status = parseStatus(statusValue);
        List<MessageThread> threads = status == null
                ? threadRepository.findByStudentIdOrderByLastMessageAtDesc(principal.id())
                : threadRepository.findByStudentIdAndStatusOrderByLastMessageAtDesc(principal.id(), status);
        return new ThreadList(threads.stream().map(this::toSummary).toList());
    }

    @Transactional
    public ThreadDetail detail(AuthUser principal, long id) {
        MessageThread thread = findThread(id);
        authorize(principal, thread);
        User student = findUser(thread.getStudentId());
        User teacher = findUser(thread.getTeacherId());
        Practice practice = thread.getPracticeId() == null
                ? null
                : practiceRepository.findById(thread.getPracticeId()).orElse(null);
        LinkedPractice linkedPractice = practice == null ? null
                : new LinkedPractice(practice.getId(), practice.getTitle(), null);
        List<Message> threadMessages = messageRepository.findByThreadIdOrderByIdAsc(id);
        if (principal.role() == Role.STUDENT) {
            LocalDateTime readAt = LocalDateTime.now(clock);
            List<Message> unreadReplies = messageRepository.findByThreadIdAndSenderRoleAndReadAtIsNull(
                    id, SenderRole.TEACHER);
            unreadReplies.forEach(message -> message.markRead(readAt));
            messageRepository.saveAll(unreadReplies);
            if (!unreadReplies.isEmpty()) {
                notificationRepository.save(new Notification(thread.getTeacherId(), NotificationType.NOTE_READ,
                        "학습자가 쪽지를 읽었어요", "쪽지 모아 보기에서 확인해 보세요", LinkType.THREAD, id));
            }
        }
        List<MessageView> messages = threadMessages.stream()
                .map(this::toMessageView).toList();
        return new ThreadDetail(thread.getId(), thread.getTopic(), thread.getStatus(), toOffset(thread.getCreatedAt()),
                linkedPractice, messages, new PersonView(student.getId(), student.getNickname()),
                new PersonView(teacher.getId(), teacher.getNickname()));
    }

    @Transactional
    public MessageView send(AuthUser principal, long id, String body) {
        validateBody(body);
        MessageThread thread = findThread(id);
        authorize(principal, thread);
        SenderRole sender = principal.role() == Role.STUDENT ? SenderRole.STUDENT : SenderRole.TEACHER;
        ThreadStatus status = sender == SenderRole.TEACHER ? ThreadStatus.ANSWERED : ThreadStatus.WAITING;
        LocalDateTime now = LocalDateTime.now(clock);
        thread.touch(now, status);
        threadRepository.save(thread);
        Message message = messageRepository.saveAndFlush(new Message(id, sender, body.strip()));
        if (sender == SenderRole.STUDENT) {
            notificationRepository.save(new Notification(thread.getTeacherId(), NotificationType.NOTE_RECEIVED,
                    "새 쪽지가 도착했어요", "쪽지 모아 보기에서 확인해 보세요", LinkType.THREAD, id));
        } else {
            notificationRepository.save(new Notification(thread.getStudentId(), NotificationType.REPLY_ARRIVED,
                    "이음쌤의 답장이 도착했어요", "쪽지함에서 확인해 보세요", LinkType.THREAD, id));
        }
        return toMessageView(message);
    }

    private ThreadSummary toSummary(MessageThread thread) {
        List<Message> messages = messageRepository.findByThreadIdOrderByIdAsc(thread.getId());
        String preview = messages.isEmpty() ? "" : messages.get(messages.size() - 1).getBody();
        Practice practice = thread.getPracticeId() == null
                ? null
                : practiceRepository.findById(thread.getPracticeId()).orElse(null);
        LinkedPractice linkedPractice = practice == null ? null
                : new LinkedPractice(practice.getId(), practice.getTitle(), null);
        return new ThreadSummary(thread.getId(), thread.getTopic(), thread.getStatus(),
                toOffset(thread.getCreatedAt()), toOffset(thread.getLastMessageAt()), preview, false, linkedPractice);
    }

    private MessageView toMessageView(Message message) {
        return new MessageView(message.getId(), message.getSenderRole(), message.getBody(), toOffset(message.getCreatedAt()));
    }

    private User assignedTeacher(User student) {
        if (student.getTeacherId() != null) {
            return userRepository.findById(student.getTeacherId())
                    .filter(user -> user.getRole() == Role.TEACHER && user.getStatus() == UserStatus.ACTIVE)
                    .orElseThrow(() -> new ApiException(ErrorCode.NO_TEACHER_AVAILABLE));
        }
        User teacher = userRepository.findFirstByRoleAndStatusOrderByIdAsc(Role.TEACHER, UserStatus.ACTIVE)
                .orElseThrow(() -> new ApiException(ErrorCode.NO_TEACHER_AVAILABLE));
        student.assignTeacher(teacher.getId(), LocalDateTime.now(clock));
        userRepository.save(student);
        return teacher;
    }

    private Long validPracticeId(Long practiceId) {
        if (practiceId == null) return null;
        return practiceRepository.findById(practiceId)
                .filter(Practice::isPublished)
                .map(Practice::getId)
                .orElseThrow(() -> ApiException.invalid("practiceId", "연결된 학습 내용을 찾을 수 없습니다."));
    }

    private MessageThread findThread(long id) {
        return threadRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private void authorize(AuthUser principal, MessageThread thread) {
        boolean allowed = principal.role() == Role.STUDENT
                ? thread.getStudentId().equals(principal.id())
                : principal.role() == Role.TEACHER && thread.getTeacherId().equals(principal.id());
        if (!allowed) throw new ApiException(ErrorCode.NOT_FOUND);
    }

    private void requireRole(AuthUser principal, Role role) {
        if (principal.role() != role) throw new ApiException(ErrorCode.FORBIDDEN);
    }

    private ThreadTopic parseTopic(String value) {
        try {
            return ThreadTopic.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw ApiException.invalid("topic", "주제를 골라 주세요.");
        }
    }

    private ThreadStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return ThreadStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("status", "status는 WAITING 또는 ANSWERED여야 합니다.");
        }
    }

    private void validateBody(String body) {
        if (body == null || body.isBlank()) throw ApiException.invalid("body", "내용을 입력해 주세요.");
        if (body.length() > BODY_MAX) throw ApiException.invalid("body", "500자 이하로 적어 주세요.");
    }

    private OffsetDateTime toOffset(LocalDateTime value) {
        return value == null ? null : value.atZone(clock.getZone()).toOffsetDateTime();
    }

    public record CreatedThread(Long id, ThreadStatus status, OffsetDateTime createdAt) {}
    public record ThreadList(List<ThreadSummary> items) {}
    public record ThreadSummary(Long id, ThreadTopic topic, ThreadStatus status, OffsetDateTime createdAt,
                                OffsetDateTime lastMessageAt, String preview, boolean unread,
                                LinkedPractice linkedPractice) {}
    public record ThreadDetail(Long id, ThreadTopic topic, ThreadStatus status, OffsetDateTime createdAt,
                               LinkedPractice linkedPractice, List<MessageView> messages,
                               PersonView student, PersonView teacher) {}
    public record LinkedPractice(Long id, String title, String pickedChoice) {}
    public record PersonView(Long id, String nickname) {}
    public record MessageView(Long id, SenderRole senderRole, String body, OffsetDateTime createdAt) {}
}
