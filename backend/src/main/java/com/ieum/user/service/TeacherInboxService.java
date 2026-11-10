package com.ieum.user.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.message.entity.Message;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.repository.MessageRepository;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.signal.entity.Severity;
import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.entity.SignalKeyword;
import com.ieum.signal.entity.SignalStatus;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.signal.repository.SignalKeywordRepository;
import com.ieum.user.dto.HandleSignalRequest;
import com.ieum.user.dto.TeacherSignalListResponse;
import com.ieum.user.dto.TeacherThreadListResponse;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * [역할] 이음쌤의 쪽지함(19), 신호 목록(20), 신호 대응 기록(21)을 처리한다.
 * [동작] 19는 내 담당 쪽지를, 20은 내 담당 학습자(teacher_id=나)의 신호를 묶음 쿼리로 모아 만든다. 21은 신호 상태·처리 시각·메모를 바꾼다.
 * [연결] TeacherInboxController가 부른다 / MessageThreadRepository, MessageRepository, SignalEventRepository, SignalKeywordRepository, UserRepository, PracticeRepository
 * [주의] /teacher/**는 SecurityConfig가 이음쌤만 통과시킨다. 신호 등급은 정렬에만 쓰고 응답에 넣지 않는다. 담당이 아닌 신호의 21은 FORBIDDEN이다.
 */
@Service
public class TeacherInboxService {

    private static final int PREVIEW_LENGTH = 40;

    private final UserRepository userRepository;
    private final MessageThreadRepository threadRepository;
    private final MessageRepository messageRepository;
    private final PracticeRepository practiceRepository;
    private final SignalEventRepository signalEventRepository;
    private final SignalKeywordRepository keywordRepository;
    private final Clock clock;

    public TeacherInboxService(UserRepository userRepository, MessageThreadRepository threadRepository,
                               MessageRepository messageRepository, PracticeRepository practiceRepository,
                               SignalEventRepository signalEventRepository, SignalKeywordRepository keywordRepository,
                               Clock clock) {
        this.userRepository = userRepository;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.practiceRepository = practiceRepository;
        this.signalEventRepository = signalEventRepository;
        this.keywordRepository = keywordRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TeacherThreadListResponse threads(Long teacherId, String status) {
        ThreadStatus filter = parseThreadStatus(status);
        List<MessageThread> threads = filter == null
                ? threadRepository.findByTeacherIdOrderByLastMessageAtDescIdDesc(teacherId)
                : threadRepository.findByTeacherIdAndStatusOrderByLastMessageAtDescIdDesc(teacherId, filter);
        if (threads.isEmpty()) {
            return new TeacherThreadListResponse(List.of());
        }

        List<Long> threadIds = threads.stream().map(MessageThread::getId).toList();
        Map<Long, Message> firstMessages = messageRepository.findFirstMessages(threadIds).stream()
                .collect(Collectors.toMap(Message::getThreadId, Function.identity()));
        Set<Long> signalThreadIds = new HashSet<>(messageRepository.findThreadIdsWithSignal(threadIds, SignalStatus.OPEN));

        List<Long> studentIds = threads.stream().map(MessageThread::getStudentId).distinct().toList();
        Map<Long, User> students = userRepository.findAllById(studentIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<Long> practiceIds = threads.stream().map(MessageThread::getPracticeId).filter(id -> id != null).distinct().toList();
        Map<Long, String> practiceTitles = practiceIds.isEmpty() ? Map.of()
                : practiceRepository.findAllById(practiceIds).stream()
                        .collect(Collectors.toMap(Practice::getId, Practice::getTitle));

        List<TeacherThreadListResponse.Item> items = threads.stream().map(t -> {
            Message first = firstMessages.get(t.getId());
            User student = students.get(t.getStudentId());
            String title = t.getPracticeId() == null ? null : practiceTitles.get(t.getPracticeId());
            return new TeacherThreadListResponse.Item(
                    t.getId(),
                    new TeacherThreadListResponse.Student(t.getStudentId(), student == null ? null : student.getNickname()),
                    t.getTopic(), t.getStatus(), toOffset(t.getLastMessageAt()),
                    first == null ? "" : preview(first.getBody()),
                    title == null ? null : new TeacherThreadListResponse.LinkedPractice(t.getPracticeId(), title),
                    signalThreadIds.contains(t.getId()));
        }).toList();
        return new TeacherThreadListResponse(items);
    }

    @Transactional(readOnly = true)
    public TeacherSignalListResponse signals(Long teacherId, String status) {
        SignalStatus filter = parseSignalStatus(status);
        List<User> myStudents = userRepository.findStudentsByTeacher(teacherId, Role.STUDENT, "%");
        if (myStudents.isEmpty()) {
            return new TeacherSignalListResponse(List.of());
        }
        Map<Long, User> students = myStudents.stream().collect(Collectors.toMap(User::getId, Function.identity()));

        List<SignalEvent> events = signalEventRepository.findByStudentIdIn(students.keySet()).stream()
                .filter(e -> filter == null || e.getStatus() == filter)
                .toList();
        if (events.isEmpty()) {
            return new TeacherSignalListResponse(List.of());
        }

        Map<Long, Severity> severities = keywordRepository
                .findAllById(events.stream().map(SignalEvent::getKeywordId).distinct().toList()).stream()
                .collect(Collectors.toMap(SignalKeyword::getId, SignalKeyword::getSeverity));
        List<SignalEvent> sorted = events.stream()
                .sorted(Comparator.<SignalEvent>comparingInt(e -> e.getStatus() == SignalStatus.OPEN ? 0 : 1)
                        .thenComparingInt(e -> severities.get(e.getKeywordId()) == Severity.CRITICAL ? 0 : 1)
                        .thenComparing(SignalEvent::getCreatedAt, Comparator.reverseOrder())
                        .thenComparing(SignalEvent::getId, Comparator.reverseOrder()))
                .toList();

        Map<Long, Message> messages = messageRepository
                .findAllById(sorted.stream().map(SignalEvent::getMessageId).distinct().toList()).stream()
                .collect(Collectors.toMap(Message::getId, Function.identity()));
        return new TeacherSignalListResponse(sorted.stream()
                .map(e -> toItem(e, students.get(e.getStudentId()), messages.get(e.getMessageId())))
                .toList());
    }

    @Transactional
    public TeacherSignalListResponse.Item handle(Long teacherId, Long signalId, HandleSignalRequest request) {
        SignalEvent event = signalEventRepository.findById(signalId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        User student = userRepository.findById(event.getStudentId()).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (student.getRole() != Role.STUDENT || !teacherId.equals(student.getTeacherId())) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        Message message = messageRepository.findById(event.getMessageId()).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        event.updateHandling(request.handled(), request.memo(), LocalDateTime.now(clock));
        signalEventRepository.save(event);
        return toItem(event, student, message);
    }

    private TeacherSignalListResponse.Item toItem(SignalEvent e, User student, Message message) {
        return new TeacherSignalListResponse.Item(e.getId(), e.getStatus(), e.getMatchedText(),
                new TeacherSignalListResponse.Student(e.getStudentId(),
                        student == null ? null : student.getNickname(),
                        student == null ? null : toOffset(student.getTeacherAssignedAt())),
                new TeacherSignalListResponse.Message(e.getMessageId(),
                        message == null ? null : message.getThreadId(),
                        message == null ? null : message.getBody(),
                        message == null ? null : toOffset(message.getCreatedAt())),
                e.getStatus() == SignalStatus.HANDLED ? toOffset(e.getHandledAt()) : null,
                e.getResponseMemo(), toOffset(e.getCreatedAt()));
    }

    // 생략하면 모두. WAITING·ANSWERED 밖의 값은 VALIDATION_FAILED(status)
    private ThreadStatus parseThreadStatus(String status) {
        if (status == null || status.isEmpty()) {
            return null;
        }
        try {
            return ThreadStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("status", "status는 WAITING 또는 ANSWERED만 쓸 수 있어요.");
        }
    }

    // 생략하면 모두. OPEN·HANDLED 밖의 값은 VALIDATION_FAILED(status)
    private SignalStatus parseSignalStatus(String status) {
        if (status == null || status.isEmpty()) {
            return null;
        }
        try {
            return SignalStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("status", "status는 OPEN 또는 HANDLED만 쓸 수 있어요.");
        }
    }

    // 글자(이모지 포함) 단위로 앞 40자만 자른다
    private String preview(String body) {
        if (body.codePointCount(0, body.length()) <= PREVIEW_LENGTH) {
            return body;
        }
        return body.substring(0, body.offsetByCodePoints(0, PREVIEW_LENGTH));
    }

    private OffsetDateTime toOffset(LocalDateTime t) {
        return t == null ? null : t.atZone(clock.getZone()).toOffsetDateTime();
    }
}
