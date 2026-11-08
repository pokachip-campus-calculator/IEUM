package com.ieum.auth.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ieum.user.repository.UserRepository;
import org.springframework.transaction.PlatformTransactionManager;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 가입·로그인 주소(/api/v1/auth/...)가 공개로 열려 있고, 응답 코드와 입력 오류 형식이 맞는지 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
class AuthApiTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean UserRepository userRepository;
    @MockitoBean PlatformTransactionManager transactionManager;   // DB 없이 @Transactional을 통과시키기 위해

    private static final String VALID_TEACHER = """
            {"role":"TEACHER","loginId":"teacher01","password":"password1","name":"김쌤","nickname":"김 이음쌤",
             "birthDate":"1990-05-20","agreeTerms":true,"agreePrivacy":true}""";

    @Test
    void 이음쌤_가입은_토큰_없이_201과_ACTIVE를_준다() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(VALID_TEACHER))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void 형식이_틀리면_400과_틀린_칸_목록을_준다() throws Exception {
        String body = """
                {"role":"STUDENT","loginId":"ab","password":"short","name":"홍길동","nickname":"",
                 "phone":"123","agreeTerms":false,"agreePrivacy":true}""";

        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='loginId')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='password')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='nickname')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='phone')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field=='agreeTerms')]").exists());
    }

    @Test
    void 없는_가입_유형은_400() throws Exception {
        String body = VALID_TEACHER.replace("TEACHER", "ADMIN");

        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void 없는_계정으로_로그인하면_401_BAD_CREDENTIALS() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"nobody\",\"password\":\"password1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("BAD_CREDENTIALS"));
    }
}
