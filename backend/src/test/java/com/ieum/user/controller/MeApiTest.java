package com.ieum.user.controller;

import com.ieum.auth.jwt.AllAccountsExistConfig;
import org.springframework.context.annotation.Import;
import com.ieum.auth.jwt.JwtProvider;
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
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] /api/v1/me 주소의 로그인 필요 여부, 응답 모양, 상태 코드(200·204·400·403)를 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AllAccountsExistConfig.class)
@TestPropertySource(properties = "jwt.secret=test-secret-test-secret-test-secret-1234")
class MeApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean UserRepository userRepository;
    @MockitoBean PlatformTransactionManager transactionManager;   // DB 없이 @Transactional을 통과시키기 위해

    @BeforeEach
    void setUp() {
        mockUser(1L, Role.STUDENT, "길동");
        mockUser(2L, Role.TEACHER, "김 이음쌤");
    }

    private void mockUser(long id, Role role, String nickname) {
        User u = new User("user" + id, "{noop}hash", role, UserStatus.ACTIVE, "이름", nickname, LocalDateTime.now());
        ReflectionTestUtils.setField(u, "id", id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
    }

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void 내_정보는_id_loginId_nickname_email_role_teacher를_준다() throws Exception {
        mockMvc.perform(get("/api/v1/me").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.loginId").value("user1"))
                .andExpect(jsonPath("$.nickname").value("길동"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.email").isEmpty())
                .andExpect(jsonPath("$.teacher").isEmpty());
    }

    @Test
    void 닉네임_수정은_GET과_같은_모양으로_응답한다() throws Exception {
        mockMvc.perform(patch("/api/v1/me").header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"새닉네임\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("새닉네임"))
                .andExpect(jsonPath("$.loginId").value("user1"));
    }

    @Test
    void 닉네임이_21자면_400과_nickname_칸_오류() throws Exception {
        mockMvc.perform(patch("/api/v1/me").header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"" + "가".repeat(21) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("nickname"));
    }

    @Test
    void 이메일_형식이_틀리면_400이고_빈_문자열은_통과한다() throws Exception {
        mockMvc.perform(patch("/api/v1/me").header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"abc\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("email"));

        mockMvc.perform(patch("/api/v1/me").header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void 현재_비밀번호가_틀리면_401이_아니라_400_currentPassword() throws Exception {
        mockMvc.perform(put("/api/v1/me/password").header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"wrong\",\"newPassword\":\"newpassword2\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("currentPassword"));
    }

    @Test
    void 학습자_탈퇴는_204() throws Exception {
        mockMvc.perform(post("/api/v1/me/withdraw").header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"acknowledged\":true}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void 확인_값이_false이면_탈퇴는_400_VALIDATION_FAILED와_acknowledged를_준다() throws Exception {
        mockMvc.perform(post("/api/v1/me/withdraw").header("Authorization", bearer(1L, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"acknowledged\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("acknowledged"));
    }

    @Test
    void 본문이_없으면_탈퇴는_400_VALIDATION_FAILED() throws Exception {
        mockMvc.perform(post("/api/v1/me/withdraw").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void 이음쌤_탈퇴는_403_FORBIDDEN() throws Exception {
        mockMvc.perform(post("/api/v1/me/withdraw").header("Authorization", bearer(2L, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"acknowledged\":true}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }
}
