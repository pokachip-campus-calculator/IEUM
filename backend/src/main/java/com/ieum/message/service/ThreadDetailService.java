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
import com.ieum.message.repository.MessageRepository;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.notification.service.NotificationService;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.entity.SignalStatus;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.signal.service.SignalCheckService;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * [역할] 쪽지 상세(14)와 이어쓰기·답장(15)을 학습자와 이음쌤이 함께 쓰도록 처리한다.
 * [동작] 둘 다 먼저 접근 권한(학습자 본인·담당 이음쌤)을 확인한다. 14는 상대가 보낸 안 읽은 메시지를 읽음 처리하고 응답을 만든다.
 *        15는 메시지를 저장하고 학습자면 WAITING + 신호 검사 + 이음쌤 알림, 이음쌤이면 ANSWERED + 학습자 알림을 한 트랜잭션으로 한다.
 * [연결] ThreadController가 부른다 / 쪽지·사용자·연습·기록·신호 저장소, SignalCheckService, NotificationService
 * [주의] signal은 이음쌤 응답에만 넣는다. my_note는 읽지도 않는다. 고른 선택지 문구만 기록의 answers에서 꺼낸다. 알림 내용은 #49가 채운다.
 */
@Service
public class ThreadDetailService {

    private final UserRepository userRepository;
    private final MessageThreadRepository threadRepository;
    private final MessageRepository messageRepository;
    private final PracticeRepository practiceRepository;
    private final PracticeRecordRepository recordRepository;
    private final SignalEventRepository signalEventRepository;
    private final SignalCheckService signalCheckService;
    private final NotificationService notificationService;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    public ThreadDetailService(UserRepository userRepository, MessageThreadRepository threadRepository,
                               MessageRepository messageRepository, PracticeRepository practiceRepository,
                               PracticeRecordRepository recordRepository, SignalEventRepository signalEventRepository,
                               SignalCheckService signalCheckService, NotificationService notificationService,
                               JsonMapper jsonMapper, Clock clock) {
        this.userRepository = userRepository;
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.practiceRepository = practiceRepository;
        this.recordRepository = recordRepository;
        this.signalEventRepository = signalEventRepository;
        this.signalCheckService = signalCheckService;
        this.notificationService = notificationService;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
    }

    // 읽음 처리(쓰기)가 있어서 readOnly가 아니다
    @Transactional
    public ThreadDetailResponse detail(Long userId, Long threadId) {
        User caller = findCaller(userId);
        MessageThread thread = findAccessibleThread(caller, threadId);
        boolean teacherView = caller.getRole() == Role.TEACHER;

        List<Message> messages = messageRepository.findByThreadIdOrderByIdAsc(thread.getId());
        markOppositeRead(messages, teacherView ? SenderRole.STUDENT : SenderRole.TEACHER, thread);
        // 이음쌤이 처음 읽은 순간에만 학습자에게 알린다(이미 읽은 메시지만 있으면 알리지 않는다)

        User student = userRepository.findById(thread.getStudentId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        User teacher = userRepository.findById(thread.getTeacherId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        return new ThreadDetailResponse(
                thread.getId(), thread.getTopic(), thread.getStatus(), toOffset(thread.getCreatedAt()),
                linkedPractice(thread),
                new ThreadDetailResponse.Person(student.getId(), student.getNickname()),
                new ThreadDetailResponse.Teacher(teacher.getNickname()),
                teacherView ? signalOf(messages) : null,
                messages.stream().map(this::toItem).toList());
    }

    @Transactional
    public SendMessageResponse send(Long userId, Long threadId, SendMessageRequest req) {
        User caller = findCaller(userId);
        MessageThread thread = findAccessibleThread(caller, threadId);
        boolean fromTeacher = caller.getRole() == Role.TEACHER;

        Message message = messageRepository.save(
                new Message(thread.getId(), fromTeacher ? SenderRole.TEACHER : SenderRole.STUDENT, req.body()));
        thread.touch(LocalDateTime.now(clock), fromTeacher ? ThreadStatus.ANSWERED : ThreadStatus.WAITING);

        if (fromTeacher) {
            notificationService.replyArrived(thread.getStudentId(), thread.getId());
        } else {
            signalCheckService.check(message, thread.getStudentId(), thread.getTeacherId());
            notificationService.noteReceived(thread.getTeacherId(), thread.getId());
        }
        return new SendMessageResponse(message.getId(), message.getSenderRole(), message.getBody(),
                toOffset(message.getCreatedAt()));
    }

    // 토큰은 맞는데 이미 탈퇴한 계정이면 로그인이 풀린 것으로 본다
    private User findCaller(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
    }

    // 없는 쪽지는 NOT_FOUND, 남의 쪽지는 FORBIDDEN. 학습자는 본인 것, 이음쌤은 teacher_id가 본인인 것만 연다
    private MessageThread findAccessibleThread(User caller, Long threadId) {
        MessageThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        boolean allowed = switch (caller.getRole()) {
            case STUDENT -> thread.getStudentId().equals(caller.getId());
            case TEACHER -> thread.getTeacherId().equals(caller.getId());
            default -> false;
        };
        if (!allowed) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return thread;
    }

    // 호출한 사람의 반대편이 보낸 안 읽은 메시지에 읽은 시각을 채운다
    private void markOppositeRead(List<Message> messages, SenderRole opposite, MessageThread thread) {
        LocalDateTime now = LocalDateTime.now(clock);
        boolean newlyRead = false;
        for (Message m : messages) {
            if (m.getSenderRole() == opposite && m.getReadAt() == null) {
                m.markRead(now);
                newlyRead = true;
            }
        }
        if (newlyRead && opposite == SenderRole.STUDENT) {
            notificationService.noteRead(thread.getStudentId(), thread.getId());
        }
    }

    // 연결 시나리오가 있으면 제목과, 그 학습자가 고른 선택지 문구를 붙인다
    private ThreadDetailResponse.LinkedPractice linkedPractice(MessageThread thread) {
        if (thread.getPracticeId() == null) {
            return null;
        }
        Optional<Practice> practice = practiceRepository.findById(thread.getPracticeId());
        if (practice.isEmpty()) {
            return null;
        }
        String picked = recordRepository.findByUserIdAndPracticeId(thread.getStudentId(), thread.getPracticeId())
                .map(r -> pickedChoiceText(r, practice.get()))
                .orElse(null);
        return new ThreadDetailResponse.LinkedPractice(practice.get().getId(), practice.get().getTitle(), picked);
    }

    // answers.choice(id)를 content.choices의 문구로 바꾼다. 못 찾으면 null. my_note는 건드리지 않는다
    private String pickedChoiceText(PracticeRecord record, Practice practice) {
        String choiceId = readTree(record.getAnswersJson()).path("choice").asString(null);
        if (choiceId == null) {
            return null;
        }
        for (JsonNode choice : readTree(practice.getContentJson()).path("choices")) {
            if (choiceId.equals(choice.path("id").asString(null))) {
                return choice.path("text").asString(null);
            }
        }
        return null;
    }

    private JsonNode readTree(String json) {
        return jsonMapper.readTree(json);
    }

    // 이음쌤용 신호 한 건: 안 처리한(OPEN) 것 먼저, 그 안에서는 최신. 없으면 null
    private ThreadDetailResponse.Signal signalOf(List<Message> messages) {
        List<Long> messageIds = messages.stream()
                .filter(m -> m.getSenderRole() == SenderRole.STUDENT).map(Message::getId).toList();
        if (messageIds.isEmpty()) {
            return null;
        }
        return signalEventRepository.findByMessageIdIn(messageIds).stream()
                .min(Comparator.comparing((SignalEvent e) -> e.getStatus() == SignalStatus.OPEN ? 0 : 1)
                        .thenComparing(SignalEvent::getId, Comparator.reverseOrder()))
                .map(e -> new ThreadDetailResponse.Signal(e.getId(), e.getStatus()))
                .orElse(null);
    }

    private ThreadDetailResponse.MessageItem toItem(Message m) {
        return new ThreadDetailResponse.MessageItem(m.getId(), m.getSenderRole(), m.getBody(), toOffset(m.getCreatedAt()));
    }

    // 저장된 한국 시각에 +09:00을 붙여 응답 규약(ISO-8601)에 맞춘다
    private OffsetDateTime toOffset(LocalDateTime time) {
        return time.atZone(clock.getZone()).toOffsetDateTime();
    }
}
