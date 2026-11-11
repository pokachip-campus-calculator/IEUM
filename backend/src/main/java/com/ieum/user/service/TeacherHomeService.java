package com.ieum.user.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.entity.RecordStatus;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.record.service.RecordViewMapper;
import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.entity.SignalStatus;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.user.dto.TeacherStudentDetailResponse;
import com.ieum.user.dto.TeacherStudentDetailResponse.RecordItem;
import com.ieum.user.dto.TeacherStudentDetailResponse.ThreadItem;
import com.ieum.user.dto.TeacherStudentListResponse;
import com.ieum.user.dto.TeacherStudentListResponse.Item;
import com.ieum.user.dto.TeacherSummaryResponse;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * [역할] 이음쌤 홈 요약(16)·학습자 목록(17)·학습자 상세(18)를 만든다.
 * [동작] 내 담당 학습자(teacher_id=나, role=STUDENT)만 모아서, 기록·쪽지·신호는 학습자 id 목록으로 한 번에 묶어 집계한다.
 * [연결] TeacherController가 부른다 / UserRepository, PracticeRecordRepository, MessageThreadRepository,
 *        SignalEventRepository, RecordViewMapper(compare·emotion 변환)
 * [주의] /teacher/**는 SecurityConfig가 이음쌤만 통과시켜서 역할은 다시 확인하지 않는다. 점수·신호 등급·my_note·answers는 내리지 않는다.
 */
@Service
public class TeacherHomeService {

    private final UserRepository userRepository;
    private final PracticeRecordRepository recordRepository;
    private final PracticeRepository practiceRepository;
    private final MessageThreadRepository threadRepository;
    private final SignalEventRepository signalEventRepository;
    private final RecordViewMapper recordViewMapper;
    private final Clock clock;

    public TeacherHomeService(UserRepository userRepository, PracticeRecordRepository recordRepository,
                              PracticeRepository practiceRepository, MessageThreadRepository threadRepository,
                              SignalEventRepository signalEventRepository, RecordViewMapper recordViewMapper,
                              Clock clock) {
        this.userRepository = userRepository;
        this.recordRepository = recordRepository;
        this.practiceRepository = practiceRepository;
        this.threadRepository = threadRepository;
        this.signalEventRepository = signalEventRepository;
        this.recordViewMapper = recordViewMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TeacherSummaryResponse summary(Long teacherId) {
        List<Long> studentIds = myStudentIds(teacherId);
        long waiting = threadRepository.countByTeacherIdAndStatus(teacherId, ThreadStatus.WAITING);
        long openSignals = studentIds.isEmpty() ? 0
                : signalEventRepository.findByStudentIdInAndStatus(studentIds, SignalStatus.OPEN).size();
        return new TeacherSummaryResponse(studentIds.size(), (int) waiting, (int) openSignals);
    }

    @Transactional(readOnly = true)
    public TeacherStudentListResponse students(Long teacherId, String q, String sort) {
        Comparator<Item> order = sortOrder(sort);   // 잘못된 sort는 조회 전에 바로 알린다

        List<User> students = userRepository.findStudentsByTeacher(teacherId, Role.STUDENT, likePattern(q));
        List<Long> ids = students.stream().map(User::getId).toList();

        Map<Long, List<PracticeRecord>> recordsByStudent = ids.isEmpty() ? Map.of()
                : recordRepository.findByUserIdIn(ids).stream().collect(Collectors.groupingBy(PracticeRecord::getUserId));
        Map<Long, List<MessageThread>> threadsByStudent = threadRepository.findByTeacherId(teacherId).stream()
                .collect(Collectors.groupingBy(MessageThread::getStudentId));
        Set<Long> openSignalStudents = ids.isEmpty() ? Set.of()
                : signalEventRepository.findByStudentIdInAndStatus(ids, SignalStatus.OPEN).stream()
                        .map(SignalEvent::getStudentId).collect(Collectors.toSet());

        List<Item> items = new ArrayList<>(students.stream()
                .map(s -> toItem(s, recordsByStudent, threadsByStudent, openSignalStudents))
                .toList());
        items.sort(order);
        return new TeacherStudentListResponse(items);
    }

    @Transactional(readOnly = true)
    public TeacherStudentDetailResponse studentDetail(Long teacherId, Long studentId) {
        User student = findMyStudent(teacherId, studentId);

        List<PracticeRecord> done = recordRepository.findByUserId(studentId).stream()
                .filter(PracticeRecord::hasCompleted)   // 다시 하는 중이어도 completed_at이 있으면 포함
                .sorted(Comparator.comparing(PracticeRecord::getCompletedAt, Comparator.nullsFirst(Comparator.<LocalDateTime>naturalOrder())).reversed())
                .toList();
        // 비공개(published=0)이거나 사라진 연습의 기록은 뺀다(11과 같은 규칙)
        Map<Long, Practice> practices = practiceRepository
                .findAllById(done.stream().map(PracticeRecord::getPracticeId).distinct().toList()).stream()
                .filter(Practice::isPublished)
                .collect(Collectors.toMap(Practice::getId, Function.identity()));
        List<RecordItem> records = done.stream()
                .filter(r -> practices.containsKey(r.getPracticeId()))
                .map(r -> toRecordItem(r, practices.get(r.getPracticeId())))
                .toList();

        List<ThreadItem> threads = threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(studentId).stream()
                .map(t -> new ThreadItem(t.getId(), t.getTopic(), t.getStatus(), toOffset(t.getCreatedAt())))
                .toList();

        boolean hasOpenSignal = signalEventRepository.existsByStudentIdAndStatus(studentId, SignalStatus.OPEN);
        return new TeacherStudentDetailResponse(student.getId(), student.getNickname(),
                toOffset(student.getTeacherAssignedAt()), hasOpenSignal, records.size(), records, threads);
    }

    private Item toItem(User s, Map<Long, List<PracticeRecord>> recordsByStudent,
                        Map<Long, List<MessageThread>> threadsByStudent, Set<Long> openSignalStudents) {
        List<PracticeRecord> records = recordsByStudent.getOrDefault(s.getId(), List.of());
        List<MessageThread> threads = threadsByStudent.getOrDefault(s.getId(), List.of());
        long doneCount = records.stream().filter(PracticeRecord::hasCompleted).count();
        long waitingCount = threads.stream().filter(t -> t.getStatus() == ThreadStatus.WAITING).count();
        LocalDateTime recordActivity = records.stream().map(PracticeRecord::getUpdatedAt)
                .max(Comparator.naturalOrder()).orElse(null);
        LocalDateTime threadActivity = threads.stream().map(MessageThread::getLastMessageAt)
                .max(Comparator.naturalOrder()).orElse(null);
        return new Item(s.getId(), s.getNickname(), toOffset(s.getTeacherAssignedAt()),
                toOffset(latest(recordActivity, threadActivity)), (int) doneCount, (int) waitingCount,
                openSignalStudents.contains(s.getId()));
    }

    private RecordItem toRecordItem(PracticeRecord r, Practice p) {
        return new RecordItem(p.getId(), p.getTitle(), p.getType(), p.getArea(), p.getLevel(),
                toOffset(r.getCompletedAt()), recordViewMapper.compare(p, r), recordViewMapper.emotion(p, r));
    }

    // 없는 id는 NOT_FOUND, 내 담당이 아니면(역할이 다르거나 teacher_id가 나와 다르면) FORBIDDEN
    private User findMyStudent(Long teacherId, Long studentId) {
        User student = userRepository.findById(studentId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (student.getRole() != Role.STUDENT || !teacherId.equals(student.getTeacherId())) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return student;
    }

    private List<Long> myStudentIds(Long teacherId) {
        return userRepository.findStudentsByTeacher(teacherId, Role.STUDENT, "%").stream().map(User::getId).toList();
    }

    // 기본(nickname)은 가나다순, assigned는 최근 배정 먼저, recent는 최근 활동 먼저(활동 없음은 맨 뒤)
    private Comparator<Item> sortOrder(String sort) {
        return switch (sort == null || sort.isBlank() ? "nickname" : sort.strip()) {
            case "nickname" -> Comparator.comparing(Item::nickname);
            case "assigned" -> Comparator.comparing(Item::assignedAt).reversed();
            case "recent" -> Comparator.comparing(Item::lastActivityAt,
                    Comparator.nullsFirst(Comparator.<OffsetDateTime>naturalOrder())).reversed();
            default -> throw ApiException.invalid("sort", "sort는 nickname, assigned, recent 중 하나여야 합니다.");
        };
    }

    // "%"(전체) 또는 "%문구%"로. LIKE의 특수문자(%·_·\)는 이스케이프해서 글자 그대로 찾는다
    private String likePattern(String q) {
        if (q == null || q.isBlank()) return "%";
        String escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    private LocalDateTime latest(LocalDateTime a, LocalDateTime b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private OffsetDateTime toOffset(LocalDateTime t) {
        return t == null ? null : t.atZone(clock.getZone()).toOffsetDateTime();
    }
}
