package com.ieum.common;

import com.ieum.auth.jwt.JwtProvider;
import com.ieum.user.entity.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * [역할] 처리되지 않던 오류(id 자리에 문자, 없는 주소, 허용되지 않는 메서드, 예상 못 한 예외)도 { code, message } 형식으로 나가는지 확인한다.
 * [동작] mock 컨트롤러가 켜진 상태에서 실제 주소를 불러 상태 코드와 code·message를 검사하고, 500은 핸들러를 직접 불러 확인한다.
 * [연결] GlobalExceptionHandler, ErrorCode
 * [주의] DB 없이 돈다. 500 응답에 예외 내용(원인 문구)이 들어가지 않는 것도 함께 확인한다.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=true"})
class GlobalExceptionHandlerApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;

    private String student() { return "Bearer " + jwtProvider.issue(12L, Role.STUDENT); }

    @Test
    void 주소의_id가_숫자가_아니면_400_VALIDATION_FAILED와_틀린_항목을_준다() throws Exception {
        mockMvc.perform(get("/api/v1/threads/abc").header("Authorization", student()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("입력 형식이 올바르지 않습니다."))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("id"));
    }

    @Test
    void 없는_주소는_404_NOT_FOUND_형식으로_나간다() throws Exception {
        mockMvc.perform(get("/api/v1/no-such-path").header("Authorization", student()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("요청한 정보를 찾을 수 없습니다."));
    }

    @Test
    void 허용하지_않는_메서드는_405_METHOD_NOT_ALLOWED로_나간다() throws Exception {
        mockMvc.perform(post("/api/v1/home").header("Authorization", student()))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
    }

    @Test
    void 예상_못_한_예외는_500_INTERNAL_ERROR이고_원인_문구를_응답에_넣지_않는다() {
        ResponseEntity<ErrorResponse> response =
                new GlobalExceptionHandler().handleUnexpected(new IllegalStateException("DB 비밀번호가 틀렸습니다"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().code()).isEqualTo("INTERNAL_ERROR");
        assertThat(response.getBody().message()).doesNotContain("DB");
    }

    @Test
    void 오류_문구는_모두_합니다체이고_마침표로_끝난다() {
        for (ErrorCode code : ErrorCode.values()) {
            assertThat(code.getMessage()).as(code.name()).endsWith(".");
            assertThat(code.getMessage()).as(code.name()).isEqualTo(code.getMessage().trim());
        }
    }
}
