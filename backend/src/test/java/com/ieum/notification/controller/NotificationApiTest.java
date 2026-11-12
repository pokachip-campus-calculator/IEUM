package com.ieum.notification.controller;

import com.ieum.auth.jwt.AllAccountsExistConfig;
import org.springframework.context.annotation.Import;
import com.ieum.auth.jwt.JwtProvider;
import com.ieum.notification.entity.LinkType;
import com.ieum.notification.entity.Notification;
import com.ieum.notification.entity.NotificationType;
import com.ieum.notification.repository.NotificationRepository;
import com.ieum.user.entity.Role;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] /api/v1/notifications 주소의 로그인 필요 여부, 응답 모양, 상태 코드(200·204·400·404)를 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AllAccountsExistConfig.class)
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234"})
class NotificationApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean NotificationRepository notificationRepository;
    @MockitoBean UserRepository userRepository;
    @MockitoBean PlatformTransactionManager transactionManager;   // DB 없이 @Transactional을 통과시키기 위해

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    private Notification notification(long id) {
        Notification n = new Notification(1L, NotificationType.REPLY_ARRIVED, "이음쌤의 답장이 도착했어요",
                "쪽지함에서 확인해 보세요", LinkType.THREAD, 7L);
        ReflectionTestUtils.setField(n, "id", id);
        ReflectionTestUtils.setField(n, "createdAt", LocalDateTime.of(2026, 11, 2, 9, 12));
        return n;
    }

    @BeforeEach
    void setUp() {
        when(notificationRepository.findTop50ByUserIdOrderByCreatedAtDescIdDesc(1L)).thenReturn(List.of(notification(41)));
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(3L);
        when(notificationRepository.findByIdAndUserId(41L, 1L)).thenReturn(Optional.of(notification(41)));
        when(notificationRepository.markAllRead(any(), any())).thenReturn(3);
    }

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/v1/notifications/41/read")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/v1/notifications/read-all")).andExpect(status().isUnauthorized());
    }

    @Test
    void 목록은_unreadCount와_items를_명세_모양으로_준다() throws Exception {
        mockMvc.perform(get("/api/v1/notifications").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(3))
                .andExpect(jsonPath("$.items[0].id").value(41))
                .andExpect(jsonPath("$.items[0].type").value("REPLY_ARRIVED"))
                .andExpect(jsonPath("$.items[0].linkType").value("THREAD"))
                .andExpect(jsonPath("$.items[0].linkId").value(7))
                .andExpect(jsonPath("$.items[0].isRead").value(false))
                .andExpect(jsonPath("$.items[0].createdAt").value("2026-11-02T09:12:00+09:00"));
    }

    @Test
    void 이음쌤도_같은_API를_쓴다() throws Exception {
        mockMvc.perform(get("/api/v1/notifications").header("Authorization", bearer(1L, Role.TEACHER)))
                .andExpect(status().isOk());
    }

    @Test
    void unread가_true_false_밖이면_400() throws Exception {
        mockMvc.perform(get("/api/v1/notifications").param("unread", "yes")
                        .header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("unread"));
    }

    @Test
    void 읽음_처리는_204이고_남의_알림이나_없는_id는_404() throws Exception {
        mockMvc.perform(patch("/api/v1/notifications/41/read").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isNoContent());
        mockMvc.perform(patch("/api/v1/notifications/41/read").header("Authorization", bearer(2L, Role.STUDENT)))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/v1/notifications/999/read").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isNotFound());
    }

    @Test
    void 모두_읽음은_바뀐_개수를_준다() throws Exception {
        mockMvc.perform(patch("/api/v1/notifications/read-all").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updated").value(3));
    }
}
