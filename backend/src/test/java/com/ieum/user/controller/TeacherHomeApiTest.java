package com.ieum.user.controller;

import com.ieum.auth.jwt.JwtProvider;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.entity.RecordStatus;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.signal.entity.SignalEvent;
import com.ieum.signal.entity.SignalStatus;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 이음쌤 홈 요약(16)·담당 학습자 목록(17)·상세(18)의 권한, 집계, 정렬·검색, compare/emotion을 DB 없이 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=false"})
class TeacherHomeApiTest {

    private static final long TEACHER_ID = 2L;

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean UserRepository userRepository;
    @MockitoBean PracticeRecordRepository recordRepository;
    @MockitoBean PracticeRepository practiceRepository;
    @MockitoBean MessageThreadRepository threadRepository;
    @MockitoBean SignalEventRepository signalEventRepository;
    @MockitoBean PlatformTransactionManager transactionManager;   // DB 없이 @Transactional을 통과시키기 위해

    // 12 하늘(내 담당, 신호 열림), 13 바다(내 담당), 99 남(다른 이음쌤 담당)
    @BeforeEach
    void setUp() {
        User haneul = student(12, "하늘", LocalDateTime.of(2026, 11, 4, 10, 30));
        User bada = student(13, "바다", LocalDateTime.of(2026, 11, 5, 9, 0));
        User other = student(99, "다른", LocalDateTime.of(2026, 11, 1, 9, 0));
        ReflectionTestUtils.setField(other, "teacherId", 3L);

        when(userRepository.findStudentsByTeacher(eq(TEACHER_ID), eq(Role.STUDENT), anyString()))
                .thenAnswer(inv -> {
                    String like = inv.getArgument(2);
                    String needle = "%".equals(like) ? null : like.substring(1, like.length() - 1);
                    return List.of(haneul, bada).stream()
                            .filter(s -> needle == null || s.getNickname().contains(needle)).toList();
                });
        when(userRepository.findById(12L)).thenReturn(Optional.of(haneul));
        when(userRepository.findById(13L)).thenReturn(Optional.of(bada));
        when(userRepository.findById(99L)).thenReturn(Optional.of(other));
        when(userRepository.findById(404L)).thenReturn(Optional.empty());
    }

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/summary")).andExpect(status().isUnauthorized());
    }

    @Test
    void 학습자면_403() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/summary").header("Authorization", student()))
                .andExpect(status().isForbidden());
    }

    @Test
    void 요약_16은_담당_학습자_수_대기_쪽지_수_열린_신호_수를_센다() throws Exception {
        when(threadRepository.countByTeacherIdAndStatus(TEACHER_ID, ThreadStatus.WAITING)).thenReturn(2L);
        when(signalEventRepository.findByStudentIdInAndStatus(anyCollection(), eq(SignalStatus.OPEN)))
                .thenReturn(List.of(signal(1, 12)));

        mockMvc.perform(get("/api/v1/teacher/summary").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentCount").value(2))
                .andExpect(jsonPath("$.waitingThreadCount").value(2))
                .andExpect(jsonPath("$.openSignalCount").value(1));
    }

    @Test
    void 목록_17은_q로_닉네임을_찾고_기본은_가나다순이다() throws Exception {
        when(recordRepository.findByUserIdIn(anyCollection())).thenReturn(List.of());
        when(threadRepository.findByTeacherId(TEACHER_ID)).thenReturn(List.of());
        when(signalEventRepository.findByStudentIdInAndStatus(anyCollection(), eq(SignalStatus.OPEN)))
                .thenReturn(List.of(signal(1, 12)));

        mockMvc.perform(get("/api/v1/teacher/students").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].nickname").value("바다"))
                .andExpect(jsonPath("$.items[1].nickname").value("하늘"))
                .andExpect(jsonPath("$.items[1].hasOpenSignal").value(true))
                .andExpect(jsonPath("$.items[0].hasOpenSignal").value(false));

        mockMvc.perform(get("/api/v1/teacher/students").param("q", "하").header("Authorization", teacher()))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].nickname").value("하늘"));
    }

    @Test
    void 목록_17은_doneCount_waitingThreadCount를_학습자별로_묶어_센다() throws Exception {
        PracticeRecord done = record(1, 12, RecordStatus.DONE, LocalDateTime.of(2026, 11, 4, 14, 0));
        PracticeRecord inProgress = record(2, 12, RecordStatus.IN_PROGRESS, null);
        when(recordRepository.findByUserIdIn(anyCollection())).thenReturn(List.of(done, inProgress));
        when(threadRepository.findByTeacherId(TEACHER_ID)).thenReturn(List.of(
                thread(31, 12, ThreadStatus.WAITING), thread(32, 13, ThreadStatus.ANSWERED)));
        when(signalEventRepository.findByStudentIdInAndStatus(anyCollection(), eq(SignalStatus.OPEN)))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/v1/teacher/students").header("Authorization", teacher()))
                .andExpect(jsonPath("$.items[1].id").value(12))
                .andExpect(jsonPath("$.items[1].doneCount").value(1))
                .andExpect(jsonPath("$.items[1].waitingThreadCount").value(1))
                .andExpect(jsonPath("$.items[0].doneCount").value(0))
                .andExpect(jsonPath("$.items[0].waitingThreadCount").value(0));
    }

    @Test
    void 잘못된_sort는_400() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/students").param("sort", "x").header("Authorization", teacher()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void 상세_18은_내_담당이_아니면_FORBIDDEN_없는_id는_NOT_FOUND() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/students/99").header("Authorization", teacher()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mockMvc.perform(get("/api/v1/teacher/students/404").header("Authorization", teacher()))
                .andExpect(status().isNotFound());
    }

    @Test
    void 상세_18은_DONE만_최신순으로_내리고_비공개_연습은_뺀다() throws Exception {
        Practice unit = practice(1, PracticeType.UNIT, "practice-1.json", true);
        Practice hidden = practice(4, PracticeType.UNIT, "practice-1.json", false);
        when(practiceRepository.findAllById(anyIterable())).thenReturn(List.of(unit, hidden));

        PracticeRecord older = record(10, 12, RecordStatus.DONE, LocalDateTime.of(2026, 10, 27, 11, 0));
        ReflectionTestUtils.setField(older, "practiceId", 1L);
        PracticeRecord newer = record(11, 12, RecordStatus.DONE, LocalDateTime.of(2026, 11, 4, 14, 0));
        ReflectionTestUtils.setField(newer, "practiceId", 1L);
        PracticeRecord hiddenDone = record(12, 12, RecordStatus.DONE, LocalDateTime.of(2026, 11, 5, 9, 0));
        ReflectionTestUtils.setField(hiddenDone, "practiceId", 4L);
        PracticeRecord inProgress = record(13, 12, RecordStatus.IN_PROGRESS, null);
        ReflectionTestUtils.setField(inProgress, "practiceId", 1L);
        when(recordRepository.findByUserId(12L)).thenReturn(List.of(older, newer, hiddenDone, inProgress));
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(12L)).thenReturn(List.of());
        when(signalEventRepository.existsByStudentIdAndStatus(12L, SignalStatus.OPEN)).thenReturn(true);

        mockMvc.perform(get("/api/v1/teacher/students/12").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("하늘"))
                .andExpect(jsonPath("$.hasOpenSignal").value(true))
                .andExpect(jsonPath("$.doneCount").value(2))
                .andExpect(jsonPath("$.records.length()").value(2))
                .andExpect(jsonPath("$.records[0].practiceId").value(1))
                .andExpect(jsonPath("$.records[0].completedAt").value("2026-11-04T14:00:00+09:00"));
    }

    @Test
    void 상세_18은_UNIT_compare와_쪽지_목록을_함께_담는다() throws Exception {
        Practice unit = practice(1, PracticeType.UNIT, "practice-1.json", true);
        when(practiceRepository.findAllById(anyIterable())).thenReturn(List.of(unit));

        PracticeRecord done = record(10, 12, RecordStatus.DONE, LocalDateTime.of(2026, 10, 29, 15, 0));
        ReflectionTestUtils.setField(done, "practiceId", 1L);
        ReflectionTestUtils.setField(done, "answersJson",
                "{\"pre\":{\"q1\":\"c\",\"q2\":\"b\"},\"post\":{\"q1\":\"b\",\"q2\":\"b\"}}");
        when(recordRepository.findByUserId(12L)).thenReturn(List.of(done));
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(12L))
                .thenReturn(List.of(thread(31, 12, ThreadStatus.WAITING)));
        when(signalEventRepository.existsByStudentIdAndStatus(12L, SignalStatus.OPEN)).thenReturn(false);

        mockMvc.perform(get("/api/v1/teacher/students/12").header("Authorization", teacher()))
                .andExpect(jsonPath("$.records[0].compare[0].questionId").value("q1"))
                .andExpect(jsonPath("$.records[0].compare[0].then").value("잘 모르겠어요"))
                .andExpect(jsonPath("$.records[0].compare[0].now").value("보내지 않고 대화를 멈춘다"))
                .andExpect(jsonPath("$.threads[0].id").value(31))
                .andExpect(jsonPath("$.threads[0].topic").value("ONLINE"))
                .andExpect(jsonPath("$.threads[0].status").value("WAITING"));
    }

    private String teacher() { return "Bearer " + jwtProvider.issue(TEACHER_ID, Role.TEACHER); }

    private String student() { return "Bearer " + jwtProvider.issue(12L, Role.STUDENT); }

    private static User student(long id, String nickname, LocalDateTime assignedAt) {
        User u = BeanUtils.instantiateClass(User.class);
        ReflectionTestUtils.setField(u, "id", id);
        ReflectionTestUtils.setField(u, "role", Role.STUDENT);
        ReflectionTestUtils.setField(u, "status", UserStatus.ACTIVE);
        ReflectionTestUtils.setField(u, "nickname", nickname);
        ReflectionTestUtils.setField(u, "teacherId", TEACHER_ID);
        ReflectionTestUtils.setField(u, "teacherAssignedAt", assignedAt);
        return u;
    }

    private static PracticeRecord record(long id, long userId, RecordStatus status, LocalDateTime completedAt) {
        PracticeRecord r = BeanUtils.instantiateClass(PracticeRecord.class);
        ReflectionTestUtils.setField(r, "id", id);
        ReflectionTestUtils.setField(r, "userId", userId);
        ReflectionTestUtils.setField(r, "practiceId", 1L);
        ReflectionTestUtils.setField(r, "status", status);
        ReflectionTestUtils.setField(r, "answersJson", "{}");
        ReflectionTestUtils.setField(r, "updatedAt", completedAt == null ? LocalDateTime.of(2026, 11, 1, 0, 0) : completedAt);
        ReflectionTestUtils.setField(r, "completedAt", completedAt);
        return r;
    }

    private static MessageThread thread(long id, long studentId, ThreadStatus status) {
        MessageThread t = new MessageThread(studentId, TEACHER_ID, ThreadTopic.ONLINE, null);
        ReflectionTestUtils.setField(t, "id", id);
        ReflectionTestUtils.setField(t, "status", status);
        ReflectionTestUtils.setField(t, "createdAt", LocalDateTime.of(2026, 11, 4, 10, 30));
        ReflectionTestUtils.setField(t, "lastMessageAt", LocalDateTime.of(2026, 11, 4, 10, 30));
        return t;
    }

    private static SignalEvent signal(long id, long studentId) {
        SignalEvent s = BeanUtils.instantiateClass(SignalEvent.class);
        ReflectionTestUtils.setField(s, "id", id);
        ReflectionTestUtils.setField(s, "studentId", studentId);
        ReflectionTestUtils.setField(s, "status", SignalStatus.OPEN);
        return s;
    }

    private static Practice practice(long id, PracticeType type, String contentFile, boolean published) throws IOException {
        String content;
        try (var in = TeacherHomeApiTest.class.getResourceAsStream("/mock/" + contentFile)) {
            content = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        Practice p = BeanUtils.instantiateClass(Practice.class);
        ReflectionTestUtils.setField(p, "id", id);
        ReflectionTestUtils.setField(p, "type", type);
        ReflectionTestUtils.setField(p, "area", PracticeArea.SAFETY);
        ReflectionTestUtils.setField(p, "level", 1);
        ReflectionTestUtils.setField(p, "title", "제목" + id);
        ReflectionTestUtils.setField(p, "contentJson", content);
        ReflectionTestUtils.setField(p, "published", published);
        return p;
    }
}
