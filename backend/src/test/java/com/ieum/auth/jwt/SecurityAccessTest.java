package com.ieum.auth.jwt;

import com.ieum.user.entity.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 공개 경로·로그인 필요 경로·이음쌤 전용 경로의 접근 규칙과 오류 형식을 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(SecurityAccessTest.ProbeController.class)
@TestPropertySource(properties = "jwt.secret=test-secret-test-secret-test-secret-1234")
class SecurityAccessTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;

    // 테스트에서만 쓰는 경로 3개 (기본 경로 /api/v1은 자동으로 붙는다)
    @RestController
    static class ProbeController {
        @GetMapping("/auth/probe") String open() { return "open"; }
        @GetMapping("/me") String me(@AuthenticationPrincipal AuthUser user) { return user.id() + ":" + user.role(); }
        @GetMapping("/teacher/probe") String teacher() { return "teacher"; }
    }

    private String bearer(Long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    @Test
    void auth_경로는_토큰_없이_열린다() throws Exception {
        mockMvc.perform(get("/api/v1/auth/probe")).andExpect(status().isOk());
    }

    @Test
    void 토큰이_없으면_UNAUTHORIZED_401() throws Exception {
        mockMvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void 위조한_토큰은_UNAUTHORIZED_401() throws Exception {
        mockMvc.perform(get("/api/v1/me").header("Authorization", "Bearer abc.def.ghi"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void 컨트롤러에서_로그인한_사용자의_id와_role을_꺼낸다() throws Exception {
        mockMvc.perform(get("/api/v1/me").header("Authorization", bearer(7L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(content().string("7:STUDENT"));
    }

    @Test
    void 학습자가_teacher_경로를_부르면_FORBIDDEN_403() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/probe").header("Authorization", bearer(7L, Role.STUDENT)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void 이음쌤은_teacher_경로를_부를_수_있다() throws Exception {
        mockMvc.perform(get("/api/v1/teacher/probe").header("Authorization", bearer(3L, Role.TEACHER)))
                .andExpect(status().isOk());
    }
}
