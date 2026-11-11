package com.ieum.user.controller;

import com.ieum.auth.jwt.AllAccountsExistConfig;
import org.springframework.context.annotation.Import;
import com.ieum.auth.jwt.JwtProvider;
import com.ieum.message.entity.Message;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.SenderRole;
import com.ieum.message.entity.ThreadStatus;
import com.ieum.message.entity.ThreadTopic;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 이음쌤 쪽지함(19)·신호 목록(20)·신호 대응 기록(21)의 권한, 필터·정렬, 담당 검사, memo 규칙을 DB 없이 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AllAccountsExistConfig.class)
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=false"})
class TeacherInboxApiTest {

    private static final long TEACHER_ID = 2L;

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean UserRepository userRepository;
    @MockitoBean MessageThreadRepository threadRepository;
    @MockitoBean MessageRepository messageRepository;
    @MockitoBean PracticeRepository practiceRepository;
    @MockitoBean SignalEventRepository signalEventRepository;
    @MockitoBean SignalKeywordRepository keywordRepository;
    @MockitoBean PlatformTransactionManager transactionManager;   // DB 없이 @Transactional을 통과시키기 위해

    private SignalEvent open5;       // 하늘(12), OPEN, CRITICAL, 11/04
    private SignalEvent open7;       // 바다(13), OPEN, WARNING, 11/05 (더 최근이지만 등급이 낮다)
    private SignalEvent open8;       // 하늘(12), OPEN, WARNING, 11/03
    private SignalEvent handled6;    // 바다(13), HANDLED, CRITICAL, 11/06, 기존 메모
    private SignalEvent others;      // 다른 이음쌤 담당 학습자(99)의 신호

    // 12 하늘·13 바다는 내 담당, 99는 다른 이음쌤(3) 담당
    @BeforeEach
    void setUp() {
        User haneul = student(12, "하늘", 2L, LocalDateTime.of(2026, 11, 4, 10, 30));
        User bada = student(13, "바다", 2L, LocalDateTime.of(2026, 11, 5, 9, 0));
        User other = student(99, "다른", 3L, LocalDateTime.of(2026, 11, 1, 9, 0));
        when(userRepository.findStudentsByTeacher(eq(TEACHER_ID), eq(Role.STUDENT), anyString()))
                .thenReturn(List.of(haneul, bada));
        when(userRepository.findAllById(anyIterable())).thenReturn(List.of(haneul, bada));
        when(userRepository.findById(12L)).thenReturn(Optional.of(haneul));
        when(userRepository.findById(13L)).thenReturn(Optional.of(bada));
        when(userRepository.findById(99L)).thenReturn(Optional.of(other));

        open5 = signal(5, 12, 101, 1, SignalStatus.OPEN, LocalDateTime.of(2026, 11, 4, 10, 30), null, null);
        open7 = signal(7, 13, 103, 2, SignalStatus.OPEN, LocalDateTime.of(2026, 11, 5, 9, 0), null, null);
        open8 = signal(8, 12, 104, 2, SignalStatus.OPEN, LocalDateTime.of(2026, 11, 3, 9, 0), null, null);
        handled6 = signal(6, 13, 105, 1, SignalStatus.HANDLED, LocalDateTime.of(2026, 11, 6, 9, 0),
                LocalDateTime.of(2026, 11, 7, 9, 0), "다음 날 담임과 통화했다");
        others = signal(9, 99, 106, 1, SignalStatus.OPEN, LocalDateTime.of(2026, 11, 8, 9, 0), null, null);
        when(signalEventRepository.findByStudentIdIn(anyCollection()))
                .thenReturn(List.of(open8, handled6, open7, open5));
        when(signalEventRepository.findById(5L)).thenReturn(Optional.of(open5));
        when(signalEventRepository.findById(6L)).thenReturn(Optional.of(handled6));
        when(signalEventRepository.findById(9L)).thenReturn(Optional.of(others));
        when(signalEventRepository.findById(404L)).thenReturn(Optional.empty());

        when(keywordRepository.findAllById(anyIterable())).thenReturn(List.of(
                keyword(1, Severity.CRITICAL), keyword(2, Severity.WARNING)));
        when(messageRepository.findAllById(anyIterable())).thenReturn(List.of(
                message(101, 31, "게임에서 알게 된 사람이 사진을 보내 달래요", LocalDateTime.of(2026, 11, 4, 10, 30)),
                message(103, 32, "요즘 학교에 가기가 조금 힘들어요", LocalDateTime.of(2026, 11, 5, 9, 0)),
                message(104, 33, "비밀", LocalDateTime.of(2026, 11, 3, 9, 0)),
                message(105, 34, "죽고 싶다", LocalDateTime.of(2026, 11, 6, 9, 0))));
        when(messageRepository.findById(101L)).thenReturn(Optional.of(
                message(101, 31, "게임에서 알게 된 사람이 사진을 보내 달래요", LocalDateTime.of(2026, 11, 4, 10, 30))));
        when(messageRepository.findById(105L)).thenReturn(Optional.of(
                message(105, 34, "죽고 싶다", LocalDateTime.of(2026, 11, 6, 9, 0))));
        when(messageRepository.findById(106L)).thenReturn(Optional.of(
                message(106, 35, "비밀", LocalDateTime.of(2026, 11, 8, 9, 0))));
    }

    // ── 공통 권한 ──

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/threads")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/teacher/signals")).andExpect(status().isUnauthorized());
    }

    @Test
    void 학습자면_403() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/threads").header("Authorization", student()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/teacher/signals").header("Authorization", student()))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/v1/teacher/signals/5").header("Authorization", student())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true}"))
                .andExpect(status().isForbidden());
    }

    // ── 19 쪽지함 ──

    @Test
    void 쪽지함_19는_담당_학습자_쪽지를_항목_모양대로_내린다() throws Exception {
        MessageThread waiting = thread(31, 12, ThreadStatus.WAITING, 7L, LocalDateTime.of(2026, 11, 4, 10, 30));
        MessageThread answered = thread(32, 13, ThreadStatus.ANSWERED, null, LocalDateTime.of(2026, 11, 3, 9, 30));
        when(threadRepository.findByTeacherIdOrderByLastMessageAtDescIdDesc(TEACHER_ID))
                .thenReturn(List.of(waiting, answered));
        when(messageRepository.findFirstMessages(anyCollection())).thenReturn(List.of(
                message(101, 31, "게임에서 알게 된 사람이 사진을 보내 달래요", LocalDateTime.of(2026, 11, 4, 10, 30)),
                message(103, 32, "가".repeat(45), LocalDateTime.of(2026, 11, 3, 9, 0))));
        when(messageRepository.findThreadIdsWithSignal(anyCollection(), eq(SignalStatus.OPEN))).thenReturn(List.of(31L));
        Practice practice = BeanUtils.instantiateClass(Practice.class);
        ReflectionTestUtils.setField(practice, "id", 7L);
        ReflectionTestUtils.setField(practice, "title", "낯선 사람의 사진 요청");
        when(practiceRepository.findAllById(anyIterable())).thenReturn(List.of(practice));

        mockMvc.perform(get("/api/v1/teacher/threads").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].id").value(31))
                .andExpect(jsonPath("$.items[0].student.id").value(12))
                .andExpect(jsonPath("$.items[0].student.nickname").value("하늘"))
                .andExpect(jsonPath("$.items[0].topic").value("ONLINE"))
                .andExpect(jsonPath("$.items[0].status").value("WAITING"))
                .andExpect(jsonPath("$.items[0].lastMessageAt").value("2026-11-04T10:30:00+09:00"))
                .andExpect(jsonPath("$.items[0].preview").value("게임에서 알게 된 사람이 사진을 보내 달래요"))
                .andExpect(jsonPath("$.items[0].linkedPractice.id").value(7))
                .andExpect(jsonPath("$.items[0].linkedPractice.title").value("낯선 사람의 사진 요청"))
                .andExpect(jsonPath("$.items[0].hasSignal").value(true))
                .andExpect(jsonPath("$.items[0].signalStatus").value("OPEN"))
                .andExpect(jsonPath("$.items[1].id").value(32))
                .andExpect(jsonPath("$.items[1].preview").value("가".repeat(40)))
                .andExpect(jsonPath("$.items[1].linkedPractice").doesNotExist())
                .andExpect(jsonPath("$.items[1].hasSignal").value(false))
                .andExpect(jsonPath("$.items[1].signalStatus").doesNotExist())
                .andExpect(jsonPath("$.items[0].severity").doesNotExist());
    }

    @Test
    void 쪽지함_19의_signalStatus는_미처리가_하나라도_있으면_OPEN_전부_처리됐으면_HANDLED_없으면_null이다() throws Exception {
        MessageThread both = thread(31, 12, ThreadStatus.WAITING, null, LocalDateTime.of(2026, 11, 4, 10, 30));
        MessageThread handledOnly = thread(32, 13, ThreadStatus.ANSWERED, null, LocalDateTime.of(2026, 11, 3, 9, 30));
        MessageThread none = thread(33, 12, ThreadStatus.ANSWERED, null, LocalDateTime.of(2026, 11, 2, 9, 30));
        when(threadRepository.findByTeacherIdOrderByLastMessageAtDescIdDesc(TEACHER_ID))
                .thenReturn(List.of(both, handledOnly, none));
        when(messageRepository.findFirstMessages(anyCollection())).thenReturn(List.of());
        // 31번은 미처리와 처리 완료 신호가 함께 있고, 32번은 처리 완료만 있다
        when(messageRepository.findThreadIdsWithSignal(anyCollection(), eq(SignalStatus.OPEN))).thenReturn(List.of(31L));
        when(messageRepository.findThreadIdsWithSignal(anyCollection(), eq(SignalStatus.HANDLED)))
                .thenReturn(List.of(31L, 32L));

        mockMvc.perform(get("/api/v1/teacher/threads").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].hasSignal").value(true))
                .andExpect(jsonPath("$.items[0].signalStatus").value("OPEN"))
                .andExpect(jsonPath("$.items[1].hasSignal").value(true))
                .andExpect(jsonPath("$.items[1].signalStatus").value("HANDLED"))
                .andExpect(jsonPath("$.items[2].hasSignal").value(false))
                .andExpect(jsonPath("$.items[2].signalStatus").doesNotExist());
    }

    @Test
    void 쪽지함_19는_status로_거른다() throws Exception {
        MessageThread waiting = thread(31, 12, ThreadStatus.WAITING, null, LocalDateTime.of(2026, 11, 4, 10, 30));
        when(threadRepository.findByTeacherIdAndStatusOrderByLastMessageAtDescIdDesc(TEACHER_ID, ThreadStatus.WAITING))
                .thenReturn(List.of(waiting));
        when(messageRepository.findFirstMessages(anyCollection())).thenReturn(List.of(
                message(101, 31, "안녕", LocalDateTime.of(2026, 11, 4, 10, 30))));
        when(messageRepository.findThreadIdsWithSignal(anyCollection(), eq(SignalStatus.OPEN))).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/teacher/threads").param("status", "WAITING").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].status").value("WAITING"));
    }

    @Test
    void 쪽지함_19는_쪽지가_없으면_빈_목록이다() throws Exception {
        when(threadRepository.findByTeacherIdOrderByLastMessageAtDescIdDesc(TEACHER_ID)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/teacher/threads").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void 쪽지함_19의_status가_틀리면_400() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/threads").param("status", "OPEN").header("Authorization", teacher()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("status"));
    }

    // ── 20 신호 목록 ──

    @Test
    void 신호_목록_20은_OPEN_먼저_CRITICAL_먼저_최신_순으로_정렬한다() throws Exception {
        // OPEN: 5(CRITICAL 11/04) → 7(WARNING 11/05) → 8(WARNING 11/03), 그 다음 HANDLED 6
        mockMvc.perform(get("/api/v1/teacher/signals").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].id").value(5))
                .andExpect(jsonPath("$.items[1].id").value(7))
                .andExpect(jsonPath("$.items[2].id").value(8))
                .andExpect(jsonPath("$.items[3].id").value(6));
    }

    @Test
    void 신호_목록_20의_항목은_기준서_모양이고_등급은_내리지_않는다() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/signals").param("status", "HANDLED").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(6))
                .andExpect(jsonPath("$.items[0].status").value("HANDLED"))
                .andExpect(jsonPath("$.items[0].matchedText").value("죽고 싶다"))
                .andExpect(jsonPath("$.items[0].student.id").value(13))
                .andExpect(jsonPath("$.items[0].student.nickname").value("바다"))
                .andExpect(jsonPath("$.items[0].student.assignedAt").value("2026-11-05T09:00:00+09:00"))
                .andExpect(jsonPath("$.items[0].message.id").value(105))
                .andExpect(jsonPath("$.items[0].message.threadId").value(34))
                .andExpect(jsonPath("$.items[0].message.body").value("죽고 싶다"))
                .andExpect(jsonPath("$.items[0].message.createdAt").value("2026-11-06T09:00:00+09:00"))
                .andExpect(jsonPath("$.items[0].handledAt").value("2026-11-07T09:00:00+09:00"))
                .andExpect(jsonPath("$.items[0].responseMemo").value("다음 날 담임과 통화했다"))
                .andExpect(jsonPath("$.items[0].createdAt").value("2026-11-06T09:00:00+09:00"))
                .andExpect(jsonPath("$.items[0].severity").doesNotExist());
    }

    @Test
    void 신호_목록_20은_status로_거른다() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/signals").param("status", "OPEN").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].handledAt").doesNotExist())
                .andExpect(jsonPath("$.items[0].responseMemo").doesNotExist());
    }

    @Test
    void 신호_목록_20의_status가_틀리면_400() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/signals").param("status", "WAITING").header("Authorization", teacher()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("status"));
    }

    @Test
    void 신호_목록_20은_담당_학습자가_없으면_빈_목록이다() throws Exception {
        when(userRepository.findStudentsByTeacher(eq(TEACHER_ID), eq(Role.STUDENT), anyString())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/teacher/signals").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    // ── 21 대응 기록 ──

    @Test
    void 대응_21은_handled_true면_HANDLED와_처리_시각_메모를_남긴다() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/5").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true,\"memo\":\"통화함\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.status").value("HANDLED"))
                .andExpect(jsonPath("$.handledAt").isNotEmpty())
                .andExpect(jsonPath("$.responseMemo").value("통화함"))
                .andExpect(jsonPath("$.student.nickname").value("하늘"))
                .andExpect(jsonPath("$.message.threadId").value(31))
                .andExpect(jsonPath("$.severity").doesNotExist());
    }

    @Test
    void 대응_21은_이미_처리된_신호에_handled_true를_또_보내면_처음_처리한_시각을_유지하고_메모만_바꾼다() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/6").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true,\"memo\":\"보호자와도 통화함\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HANDLED"))
                .andExpect(jsonPath("$.handledAt").value("2026-11-07T09:00:00+09:00"))
                .andExpect(jsonPath("$.responseMemo").value("보호자와도 통화함"));
    }

    @Test
    void 대응_21은_처리를_취소했다가_다시_누르면_처음_처리한_시각으로_돌아온다() throws Exception {
        // 처음 처리(11/7 09:00) 뒤 handled:false로 되돌린 상태. 시각은 남아 있지만 OPEN이라 응답에는 안 나간다
        SignalEvent reopened = signal(10, 12, 101, 1, SignalStatus.OPEN, LocalDateTime.of(2026, 11, 3, 9, 0),
                LocalDateTime.of(2026, 11, 7, 9, 0), null);
        when(signalEventRepository.findById(10L)).thenReturn(Optional.of(reopened));
        when(signalEventRepository.findByStudentIdIn(anyCollection())).thenReturn(List.of(reopened));

        mockMvc.perform(get("/api/v1/teacher/signals").header("Authorization", teacher()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].status").value("OPEN"))
                .andExpect(jsonPath("$.items[0].handledAt").doesNotExist());

        mockMvc.perform(patch("/api/v1/teacher/signals/10").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HANDLED"))
                .andExpect(jsonPath("$.handledAt").value("2026-11-07T09:00:00+09:00"));
    }

    @Test
    void 대응_21은_handled_false면_OPEN으로_되돌리고_처리_시각을_비우며_memo_생략은_그대로_둔다() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/6").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.handledAt").doesNotExist())
                .andExpect(jsonPath("$.responseMemo").value("다음 날 담임과 통화했다"));
    }

    @Test
    void 대응_21은_memo가_500자를_넘으면_400이고_정확히_500자는_통과한다() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/5").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"handled\":true,\"memo\":\"" + "가".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("memo"));
        mockMvc.perform(patch("/api/v1/teacher/signals/5").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"handled\":true,\"memo\":\"" + "가".repeat(500) + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void 대응_21은_handled가_없으면_400() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/5").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"memo\":\"통화함\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("handled"));
    }

    @Test
    void 대응_21은_담당이_아닌_학습자의_신호면_403() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/9").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void 대응_21은_없는_신호면_404() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/404").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true}"))
                .andExpect(status().isNotFound());
    }

    private String student() { return "Bearer " + jwtProvider.issue(12L, Role.STUDENT); }
    private String teacher() { return "Bearer " + jwtProvider.issue(TEACHER_ID, Role.TEACHER); }

    private static User student(long id, String nickname, Long teacherId, LocalDateTime assignedAt) {
        User u = BeanUtils.instantiateClass(User.class);
        ReflectionTestUtils.setField(u, "id", id);
        ReflectionTestUtils.setField(u, "nickname", nickname);
        ReflectionTestUtils.setField(u, "role", Role.STUDENT);
        ReflectionTestUtils.setField(u, "status", UserStatus.ACTIVE);
        ReflectionTestUtils.setField(u, "teacherId", teacherId);
        ReflectionTestUtils.setField(u, "teacherAssignedAt", assignedAt);
        return u;
    }

    private static MessageThread thread(long id, long studentId, ThreadStatus status, Long practiceId, LocalDateTime lastAt) {
        MessageThread t = new MessageThread(studentId, TEACHER_ID, ThreadTopic.ONLINE, practiceId);
        ReflectionTestUtils.setField(t, "id", id);
        ReflectionTestUtils.setField(t, "status", status);
        ReflectionTestUtils.setField(t, "createdAt", lastAt);
        ReflectionTestUtils.setField(t, "lastMessageAt", lastAt);
        return t;
    }

    private static Message message(long id, long threadId, String body, LocalDateTime createdAt) {
        Message m = new Message(threadId, SenderRole.STUDENT, body);
        ReflectionTestUtils.setField(m, "id", id);
        ReflectionTestUtils.setField(m, "createdAt", createdAt);
        return m;
    }

    private static SignalKeyword keyword(long id, Severity severity) {
        SignalKeyword k = BeanUtils.instantiateClass(SignalKeyword.class);
        ReflectionTestUtils.setField(k, "id", id);
        ReflectionTestUtils.setField(k, "severity", severity);
        return k;
    }

    private static SignalEvent signal(long id, long studentId, long messageId, long keywordId, SignalStatus status,
                                      LocalDateTime createdAt, LocalDateTime handledAt, String memo) {
        SignalEvent s = new SignalEvent(studentId, messageId, keywordId, "낱말");
        ReflectionTestUtils.setField(s, "id", id);
        ReflectionTestUtils.setField(s, "status", status);
        ReflectionTestUtils.setField(s, "createdAt", createdAt);
        ReflectionTestUtils.setField(s, "handledAt", handledAt);
        ReflectionTestUtils.setField(s, "responseMemo", memo);
        if (id == 5) ReflectionTestUtils.setField(s, "matchedText", "죽고 싶다");
        if (id == 6) ReflectionTestUtils.setField(s, "matchedText", "죽고 싶다");
        return s;
    }
}
