package com.ieum.mock;

import com.ieum.auth.jwt.JwtProvider;
import com.ieum.user.entity.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] mock API 16개(09~24)의 접근 규칙, 응답 모양, 기준서 오류 코드를 DB 없이 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=true"})   // yaml 값과 무관하게 학습 mock(07~10)을 켠다
class MockApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;

    private String student() { return "Bearer " + jwtProvider.issue(12L, Role.STUDENT); }
    private String teacher() { return "Bearer " + jwtProvider.issue(2L, Role.TEACHER); }

    @Test
    void 연습_상세_09는_content와_record를_내린다() throws Exception {
        mockMvc.perform(get("/api/v1/practices/1").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("UNIT"))
                .andExpect(jsonPath("$.content.questions[0].id").value("q1"))
                .andExpect(jsonPath("$.record.status").value("DONE"));
        mockMvc.perform(get("/api/v1/practices/3").header("Authorization", student()))
                .andExpect(jsonPath("$.record").doesNotExist())
                .andExpect(jsonPath("$.content.clues[0].id").value("k1"));
        mockMvc.perform(get("/api/v1/practices/999").header("Authorization", student()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void 홈_07과_연습_목록_08은_mock이_기본이고_09_11_샘플과_상태가_맞는다() throws Exception {
        mockMvc.perform(get("/api/v1/home").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doneTotal").value(1))
                .andExpect(jsonPath("$.resume.practiceId").value(2))
                .andExpect(jsonPath("$.resume.myStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.resume.status").doesNotExist())
                .andExpect(jsonPath("$.recent[0].completedAt").value("2026-10-29T15:00:00+09:00"));
        mockMvc.perform(get("/api/v1/practices").param("area", "HELP").header("Authorization", student()))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].myStatus").value("IN_PROGRESS"));
        mockMvc.perform(get("/api/v1/practices").param("q", "친구").header("Authorization", student()))
                .andExpect(jsonPath("$.items[0].id").value(3));
        mockMvc.perform(get("/api/v1/practices").param("level", "abc").header("Authorization", student()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/home").header("Authorization", teacher()))
                .andExpect(status().isForbidden());
    }

    @Test
    void 학습자_전용_API는_이음쌤이_부르면_403() throws Exception {
        mockMvc.perform(get("/api/v1/practices/1").header("Authorization", teacher()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/records")).andExpect(status().isUnauthorized());
    }

    @Test
    void 진행_저장_10은_done에_따라_상태가_바뀌고_비어_있으면_RECORD_INCOMPLETE() throws Exception {
        mockMvc.perform(put("/api/v1/practices/2/record").header("Authorization", student())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\":{\"choice\":\"c2\"},\"myNote\":\"메모\",\"done\":true,\"restart\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.myNote").value("메모"));
        mockMvc.perform(put("/api/v1/practices/2/record").header("Authorization", student())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"answers\":{},\"done\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RECORD_INCOMPLETE"));
    }

    @Test
    void 학습_기록_11은_status_필터와_잘못된_값_검사를_한다() throws Exception {
        mockMvc.perform(get("/api/v1/records").param("status", "DONE").header("Authorization", student()))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.doneCount").value(1));
        mockMvc.perform(get("/api/v1/records").param("sort", "x").header("Authorization", student()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void 쪽지_12는_201이고_body가_공백이면_400() throws Exception {
        mockMvc.perform(post("/api/v1/threads").header("Authorization", student())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"ONLINE\",\"body\":\"안녕\",\"practiceId\":2}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("WAITING"));
        mockMvc.perform(post("/api/v1/threads").header("Authorization", student())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\":\"ONLINE\",\"body\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("body"));
    }

    @Test
    void 쪽지_14는_이음쌤에게만_signal을_내린다() throws Exception {
        mockMvc.perform(get("/api/v1/threads/31").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.signal").doesNotExist())
                .andExpect(jsonPath("$.messages.length()").value(2));
        mockMvc.perform(get("/api/v1/threads/31").header("Authorization", teacher()))
                .andExpect(jsonPath("$.signal.status").value("OPEN"));
    }

    @Test
    void 이어쓰기_15의_senderRole은_호출한_사람의_역할() throws Exception {
        mockMvc.perform(post("/api/v1/threads/31/messages").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"body\":\"답장\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.senderRole").value("TEACHER"));
    }

    @Test
    void 이음쌤_API_19_21은_이음쌤만_열린다() throws Exception {
        // 16~18(요약·학습자 목록·상세)은 TeacherController가 실제로 구현해서 TeacherHomeApiTest가 맡는다
        mockMvc.perform(get("/api/v1/teacher/threads").header("Authorization", student()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/teacher/threads").param("status", "WAITING").header("Authorization", teacher()))
                .andExpect(jsonPath("$.items.length()").value(1));
        mockMvc.perform(get("/api/v1/teacher/signals").param("status", "OPEN").header("Authorization", teacher()))
                .andExpect(jsonPath("$.items[0].id").value(5));
    }

    @Test
    void 신호_대응_21은_handled에_따라_상태를_돌려준다() throws Exception {
        mockMvc.perform(patch("/api/v1/teacher/signals/5").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true,\"memo\":\"통화함\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HANDLED"))
                .andExpect(jsonPath("$.responseMemo").value("통화함"));
        mockMvc.perform(patch("/api/v1/teacher/signals/999").header("Authorization", teacher())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"handled\":true}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void 알림_22_24는_학습자_이음쌤_모두_쓴다() throws Exception {
        mockMvc.perform(get("/api/v1/notifications").param("unread", "true").header("Authorization", student()))
                .andExpect(jsonPath("$.unreadCount").value(3))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].isRead").value(false));
        mockMvc.perform(patch("/api/v1/notifications/41/read").header("Authorization", teacher()))
                .andExpect(status().isNoContent());
        mockMvc.perform(patch("/api/v1/notifications/999/read").header("Authorization", student()))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch("/api/v1/notifications/read-all").header("Authorization", student()))
                .andExpect(jsonPath("$.updated").value(3));
    }
}
