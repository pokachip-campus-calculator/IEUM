package com.ieum.message.controller;

import com.ieum.auth.jwt.JwtProvider;
import com.ieum.message.entity.Message;
import com.ieum.message.entity.MessageThread;
import com.ieum.message.entity.SenderRole;
import com.ieum.message.entity.ThreadTopic;
import com.ieum.message.repository.MessageRepository;
import com.ieum.message.repository.MessageThreadRepository;
import com.ieum.notification.repository.NotificationRepository;
import com.ieum.practice.repository.PracticeRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=false"})
class ThreadApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean MessageThreadRepository threadRepository;
    @MockitoBean MessageRepository messageRepository;
    @MockitoBean UserRepository userRepository;
    @MockitoBean PracticeRepository practiceRepository;
    @MockitoBean NotificationRepository notificationRepository;
    @MockitoBean PlatformTransactionManager transactionManager;

    private User student;
    private User teacher;

    @BeforeEach
    void setUp() {
        student = user(1L, Role.STUDENT, "하늘");
        teacher = user(2L, Role.TEACHER, "푸른 이음쌤");
    }

    @Test
    void 새_계정의_쪽지함은_비어_있다() throws Exception {
        when(threadRepository.findByStudentIdOrderByLastMessageAtDesc(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/threads").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void 새_계정은_시연용_알림을_받지_않는다() throws Exception {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/notifications").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0))
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    void 새_쪽지를_보내면_쪽지와_첫_메시지를_저장한다() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(userRepository.findFirstByRoleAndStatusOrderByIdAsc(Role.TEACHER, UserStatus.ACTIVE))
                .thenReturn(Optional.of(teacher));
        when(threadRepository.saveAndFlush(any(MessageThread.class))).thenAnswer(invocation -> {
            MessageThread thread = invocation.getArgument(0);
            ReflectionTestUtils.setField(thread, "id", 10L);
            ReflectionTestUtils.setField(thread, "createdAt", now);
            ReflectionTestUtils.setField(thread, "lastMessageAt", now);
            return thread;
        });
        when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/v1/threads")
                        .header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"FRIEND\",\"body\":\"친구와 이야기하고 싶어요.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.status").value("WAITING"));

        verify(messageRepository).saveAndFlush(any(Message.class));
    }

    @Test
    void 이어_보낸_쪽지는_메시지로_저장한다() throws Exception {
        MessageThread thread = new MessageThread(1L, 2L, ThreadTopic.FRIEND, null);
        ReflectionTestUtils.setField(thread, "id", 10L);
        ReflectionTestUtils.setField(thread, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(thread, "lastMessageAt", LocalDateTime.now());
        when(threadRepository.findById(10L)).thenReturn(Optional.of(thread));
        when(messageRepository.saveAndFlush(any(Message.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/v1/threads/10/messages")
                        .header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"body\":\"조금 더 이야기하고 싶어요.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senderRole").value("STUDENT"))
                .andExpect(jsonPath("$.body").value("조금 더 이야기하고 싶어요."));

        verify(messageRepository).saveAndFlush(any(Message.class));
    }

    @Test
    void 쪽지함에서_답변을_열면_읽음으로_처리한다() throws Exception {
        MessageThread thread = new MessageThread(1L, 2L, ThreadTopic.FRIEND, null);
        ReflectionTestUtils.setField(thread, "id", 10L);
        ReflectionTestUtils.setField(thread, "createdAt", LocalDateTime.now());
        ReflectionTestUtils.setField(thread, "lastMessageAt", LocalDateTime.now());
        Message reply = new Message(10L, SenderRole.TEACHER, "무슨 일이 있었는지 말해 줄래요?");
        ReflectionTestUtils.setField(reply, "id", 15L);
        ReflectionTestUtils.setField(reply, "createdAt", LocalDateTime.now());
        when(threadRepository.findById(10L)).thenReturn(Optional.of(thread));
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));
        when(userRepository.findById(2L)).thenReturn(Optional.of(teacher));
        when(messageRepository.findByThreadIdOrderByIdAsc(10L)).thenReturn(List.of(reply));
        when(messageRepository.findByThreadIdAndSenderRoleAndReadAtIsNull(10L, SenderRole.TEACHER))
                .thenReturn(List.of(reply));

        mockMvc.perform(get("/api/v1/threads/10").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages[0].body").value("무슨 일이 있었는지 말해 줄래요?"));

        verify(messageRepository).saveAll(List.of(reply));
        verify(notificationRepository).save(any());
    }

    private User user(Long id, Role role, String nickname) {
        User user = new User("login" + id, "hash", role, UserStatus.ACTIVE,
                nickname, nickname, LocalDateTime.now());
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private String bearer(Long id, Role role) {
        return "Bearer " + jwtProvider.issue(id, role);
    }
}
