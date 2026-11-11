package com.ieum.auth.jwt;

import com.ieum.user.entity.Role;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 탈퇴(계정 삭제)한 계정의 토큰으로 로그인 필요 API를 부르면 모두 UNAUTHORIZED(401)인지 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=false"})
class WithdrawnTokenApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @Autowired AccountChecker accountChecker;
    @MockitoBean UserRepository userRepository;                   // existsById 기본값 false = 삭제된 계정
    @MockitoBean PlatformTransactionManager transactionManager;   // DB 없이 @Transactional을 통과시키기 위해

    @BeforeEach
    void 계정_확인_기억_비우기() { accountChecker.clear(); }   // 앞 테스트의 "있다" 기억이 남지 않게

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    private void expect401(MockHttpServletRequestBuilder request) throws Exception {
        mockMvc.perform(request)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void 탈퇴한_학습자_토큰은_학습자_API에서_모두_401() throws Exception {
        String token = bearer(12L, Role.STUDENT);
        String json = "{}";
        expect401(get("/api/v1/me").header("Authorization", token));                                   // 03
        expect401(patch("/api/v1/me").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(json));      // 04
        expect401(put("/api/v1/me/password").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(json)); // 05
        expect401(post("/api/v1/me/withdraw").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(json)); // 06
        expect401(get("/api/v1/home").header("Authorization", token));                                 // 07
        expect401(get("/api/v1/practices").header("Authorization", token));                            // 08
        expect401(get("/api/v1/practices/1").header("Authorization", token));                          // 09
        expect401(put("/api/v1/practices/1/record").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(json)); // 10
        expect401(get("/api/v1/records").header("Authorization", token));                              // 11
        expect401(post("/api/v1/threads").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(json));   // 12
        expect401(get("/api/v1/threads").header("Authorization", token));                              // 13
        expect401(get("/api/v1/threads/1").header("Authorization", token));                            // 14
        expect401(post("/api/v1/threads/1/messages").header("Authorization", token).contentType(MediaType.APPLICATION_JSON).content(json)); // 15
        expect401(get("/api/v1/notifications").header("Authorization", token));                        // 22
        expect401(patch("/api/v1/notifications/1/read").header("Authorization", token));               // 23
        expect401(patch("/api/v1/notifications/read-all").header("Authorization", token));             // 24
    }

    @Test
    void 탈퇴한_이음쌤_토큰도_이음쌤_API에서_401() throws Exception {
        expect401(get("/api/v1/teacher/summary").header("Authorization", bearer(2L, Role.TEACHER)));
    }

    @Test
    void 계정이_있으면_통과한다() throws Exception {
        when(userRepository.existsById(12L)).thenReturn(true);
        // 인증은 통과하므로 401이 아니다(여기서는 홈이 사용자 조회에 실패해 401을 내지 않도록 notifications로 확인)
        mockMvc.perform(get("/api/v1/notifications").header("Authorization", bearer(12L, Role.STUDENT)))
                .andExpect(result -> {
                    if (result.getResponse().getStatus() == 401) {
                        throw new AssertionError("계정이 있는데 401이 내려갔습니다.");
                    }
                });
    }
}
