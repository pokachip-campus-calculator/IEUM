package com.ieum.message.controller;

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
import com.ieum.notification.repository.NotificationRepository;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.signal.repository.SignalEventRepository;
import com.ieum.signal.repository.SignalKeywordRepository;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] /api/v1/threads 주소의 로그인 필요 여부, 응답 모양, 상태 코드(200·201·400·403·409)를 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AllAccountsExistConfig.class)
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=false"})
class ThreadApiTest {

    private static final LocalDateTime T = LocalDateTime.of(2026, 11, 4, 10, 30);
    private static final String BODY = "{\"topic\":\"ONLINE\",\"body\":\"게임에서 알게 된 사람이 사진을 보내 달래요\"}";

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean UserRepository userRepository;
    @MockitoBean MessageThreadRepository threadRepository;
    @MockitoBean MessageRepository messageRepository;
    @MockitoBean PracticeRepository practiceRepository;
    @MockitoBean PracticeRecordRepository recordRepository;
    @MockitoBean SignalKeywordRepository signalKeywordRepository;   // 신호 검사가 DB에 닿지 않게 막는다
    @MockitoBean SignalEventRepository signalEventRepository;
    @MockitoBean NotificationRepository notificationRepository;   // 알림 저장이 DB에 닿지 않게 막는다
    @MockitoBean PlatformTransactionManager transactionManager;   // DB 없이 @Transactional을 통과시키기 위해

    @BeforeEach
    void setUp() {
        mockUser(1L, Role.STUDENT);
        mockUser(9L, Role.TEACHER);
        when(threadRepository.save(any(MessageThread.class))).thenAnswer(inv -> {
            MessageThread t = inv.getArgument(0);
            ReflectionTestUtils.setField(t, "id", 31L);
            ReflectionTestUtils.setField(t, "createdAt", T);
            ReflectionTestUtils.setField(t, "lastMessageAt", T);
            return t;
        });
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            ReflectionTestUtils.setField(m, "id", 101L);
            ReflectionTestUtils.setField(m, "createdAt", T);
            return m;
        });
    }

    private User mockUser(long id, Role role) {
        User u = new User("user" + id, "{noop}hash", role, UserStatus.ACTIVE, "이름", "닉" + id, T);
        ReflectionTestUtils.setField(u, "id", id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        return u;
    }

    private User teacher() {
        User u = new User("user9", "{noop}hash", Role.TEACHER, UserStatus.ACTIVE, "이름", "닉9", T);
        ReflectionTestUtils.setField(u, "id", 9L);
        return u;
    }

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder send(String json) {
        return post("/api/v1/threads").header("Authorization", bearer(1L, Role.STUDENT))
                .contentType(MediaType.APPLICATION_JSON).content(json);
    }

    // ---------- 12 ----------

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(post("/api/v1/threads").contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/threads")).andExpect(status().isUnauthorized());
    }

    @Test
    void 쪽지를_보내면_201과_id_status_createdAt만_준다() throws Exception {
        when(userRepository.findLeastLoadedTeacher()).thenReturn(Optional.of(teacher()));

        mockMvc.perform(send(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(31))
                .andExpect(jsonPath("$.status").value("WAITING"))
                .andExpect(jsonPath("$.createdAt").value("2026-11-04T10:30:00+09:00"))
                .andExpect(jsonPath("$.signal").doesNotExist())
                .andExpect(jsonPath("$.length()").value(3));
    }

    @Test
    void 이음쌤이_한_명도_없으면_409_NO_TEACHER_AVAILABLE이고_저장하지_않는다() throws Exception {
        when(userRepository.findLeastLoadedTeacher()).thenReturn(Optional.empty());

        mockMvc.perform(send(BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NO_TEACHER_AVAILABLE"));

        verify(threadRepository, never()).save(any());
        verify(messageRepository, never()).save(any());
    }

    @Test
    void 내용이_공백뿐이면_400_body_칸_오류() throws Exception {
        mockMvc.perform(send("{\"topic\":\"ONLINE\",\"body\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("body"));
    }

    @Test
    void 내용이_없거나_501자면_400_body_칸_오류() throws Exception {
        mockMvc.perform(send("{\"topic\":\"ONLINE\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("body"));

        mockMvc.perform(send("{\"topic\":\"ONLINE\",\"body\":\"" + "가".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("body"));
    }

    @Test
    void 내용이_500자면_통과한다() throws Exception {
        when(userRepository.findLeastLoadedTeacher()).thenReturn(Optional.of(teacher()));

        mockMvc.perform(send("{\"topic\":\"ONLINE\",\"body\":\"" + "가".repeat(500) + "\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void 주제가_없거나_목록_밖이면_400() throws Exception {
        mockMvc.perform(send("{\"body\":\"안녕\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("topic"));

        mockMvc.perform(send("{\"topic\":\"GAME\",\"body\":\"안녕\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void 없는_practiceId면_400_practiceId_칸_오류() throws Exception {
        when(practiceRepository.existsById(999L)).thenReturn(false);

        mockMvc.perform(send("{\"topic\":\"ONLINE\",\"body\":\"안녕\",\"practiceId\":999}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("practiceId"));
    }

    @Test
    void 이음쌤이_쪽지를_보내면_403() throws Exception {
        mockMvc.perform(post("/api/v1/threads").header("Authorization", bearer(9L, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    // ---------- 13 ----------

    @Test
    void 쪽지함은_items_안에_약속한_필드를_준다() throws Exception {
        MessageThread t = new MessageThread(1L, 9L, ThreadTopic.ONLINE, null);
        ReflectionTestUtils.setField(t, "id", 31L);
        ReflectionTestUtils.setField(t, "createdAt", T);
        ReflectionTestUtils.setField(t, "lastMessageAt", T.plusHours(4));
        ReflectionTestUtils.setField(t, "status", ThreadStatus.ANSWERED);
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L)).thenReturn(List.of(t));
        Message first = new Message(31L, SenderRole.STUDENT, "게임에서 알게 된 사람이 사진을 보내 달래요");
        when(messageRepository.findFirstMessages(any())).thenReturn(List.of(first));
        when(messageRepository.findThreadIdsWithUnread(any(), any())).thenReturn(List.of(31L));

        mockMvc.perform(get("/api/v1/threads").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(31))
                .andExpect(jsonPath("$.items[0].topic").value("ONLINE"))
                .andExpect(jsonPath("$.items[0].status").value("ANSWERED"))
                .andExpect(jsonPath("$.items[0].createdAt").value("2026-11-04T10:30:00+09:00"))
                .andExpect(jsonPath("$.items[0].lastMessageAt").value("2026-11-04T14:30:00+09:00"))
                .andExpect(jsonPath("$.items[0].preview").value("게임에서 알게 된 사람이 사진을 보내 달래요"))
                .andExpect(jsonPath("$.items[0].unread").value(true))
                .andExpect(jsonPath("$.items[0].linkedPractice").isEmpty());
    }

    @Test
    void status를_주면_그_상태만_거르고_생략하면_모두() throws Exception {
        when(threadRepository.findByStudentIdOrderByLastMessageAtDescIdDesc(1L)).thenReturn(List.of());
        when(threadRepository.findByStudentIdAndStatusOrderByLastMessageAtDescIdDesc(1L, ThreadStatus.WAITING)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/threads?status=WAITING").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
        verify(threadRepository).findByStudentIdAndStatusOrderByLastMessageAtDescIdDesc(1L, ThreadStatus.WAITING);

        mockMvc.perform(get("/api/v1/threads").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk());
        verify(threadRepository).findByStudentIdOrderByLastMessageAtDescIdDesc(1L);
    }

    @Test
    void status가_허용_값_밖이면_400_status_칸_오류() throws Exception {
        mockMvc.perform(get("/api/v1/threads?status=DONE").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("status"));
    }

    @Test
    void 이음쌤이_쪽지함을_부르면_403() throws Exception {
        mockMvc.perform(get("/api/v1/threads").header("Authorization", bearer(9L, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    // ---------- 14·15 ----------

    private MessageThread thread31() {
        MessageThread t = new MessageThread(1L, 9L, ThreadTopic.ONLINE, null);
        ReflectionTestUtils.setField(t, "id", 31L);
        ReflectionTestUtils.setField(t, "createdAt", T);
        ReflectionTestUtils.setField(t, "lastMessageAt", T);
        when(threadRepository.findById(31L)).thenReturn(Optional.of(t));
        return t;
    }

    private Message message(long id, SenderRole role, String body) {
        Message m = new Message(31L, role, body);
        ReflectionTestUtils.setField(m, "id", id);
        ReflectionTestUtils.setField(m, "createdAt", T);
        return m;
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder reply(long userId, Role role, String json) {
        return post("/api/v1/threads/31/messages").header("Authorization", bearer(userId, role))
                .contentType(MediaType.APPLICATION_JSON).content(json);
    }

    @Test
    void 학습자_상세는_signal_키가_없고_my_note도_없다() throws Exception {
        thread31();
        when(messageRepository.findByThreadIdOrderByIdAsc(31L)).thenReturn(List.of(message(101L, SenderRole.STUDENT, "도와주세요")));

        mockMvc.perform(get("/api/v1/threads/31").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(31))
                .andExpect(jsonPath("$.student.nickname").value("닉1"))
                .andExpect(jsonPath("$.teacher.nickname").value("닉9"))
                .andExpect(jsonPath("$.messages[0].body").value("도와주세요"))
                .andExpect(jsonPath("$.messages[0].createdAt").value("2026-11-04T10:30:00+09:00"))
                .andExpect(jsonPath("$.signal").doesNotExist())
                .andExpect(jsonPath("$.myNote").doesNotExist());
    }

    @Test
    void 남의_쪽지는_403_없는_쪽지는_404() throws Exception {
        thread31();
        mockUser(2L, Role.STUDENT);
        mockUser(8L, Role.TEACHER);

        mockMvc.perform(get("/api/v1/threads/31").header("Authorization", bearer(2L, Role.STUDENT)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mockMvc.perform(get("/api/v1/threads/31").header("Authorization", bearer(8L, Role.TEACHER)))
                .andExpect(status().isForbidden());
        when(threadRepository.findById(404L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/v1/threads/404").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isNotFound());
    }

    @Test
    void 이어쓰기는_201과_네_필드를_주고_학습자가_보내면_WAITING() throws Exception {
        MessageThread t = thread31();
        ReflectionTestUtils.setField(t, "status", ThreadStatus.ANSWERED);

        mockMvc.perform(reply(1L, Role.STUDENT, "{\"body\":\"고마워요\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(101))
                .andExpect(jsonPath("$.senderRole").value("STUDENT"))
                .andExpect(jsonPath("$.body").value("고마워요"))
                .andExpect(jsonPath("$.length()").value(4));
        org.assertj.core.api.Assertions.assertThat(t.getStatus()).isEqualTo(ThreadStatus.WAITING);
    }

    @Test
    void 이음쌤이_답장하면_ANSWERED() throws Exception {
        MessageThread t = thread31();

        mockMvc.perform(reply(9L, Role.TEACHER, "{\"body\":\"어떤 마음이에요?\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senderRole").value("TEACHER"));
        org.assertj.core.api.Assertions.assertThat(t.getStatus()).isEqualTo(ThreadStatus.ANSWERED);
    }

    @Test
    void 이어쓰기_본문이_비었거나_501자면_400() throws Exception {
        thread31();
        for (String json : List.of("{\"body\":\"  \"}", "{}", "{\"body\":\"" + "가".repeat(501) + "\"}")) {
            mockMvc.perform(reply(1L, Role.STUDENT, json))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors[0].field").value("body"));
        }
    }
}
