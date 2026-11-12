package com.ieum.transfer.controller;

import com.ieum.auth.jwt.AllAccountsExistConfig;
import com.ieum.auth.jwt.JwtProvider;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.transfer.dto.TransferCreateResponse;
import com.ieum.transfer.entity.TransferStatus;
import com.ieum.transfer.service.TransferService;
import com.ieum.user.entity.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 이관 신청(25)·수락(26) 주소의 이음쌤 전용 접근, 상태 코드(201·204·400·401·403·409), 응답 모양을 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AllAccountsExistConfig.class)
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234"})
class TransferApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean TransferService transferService;

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    private static final String BODY = "{\"toLoginId\":\"teacher2\"}";

    @Test
    void 신청은_201과_신청_번호를_준다() throws Exception {
        when(transferService.create(2L, 12L, "teacher2")).thenReturn(
                new TransferCreateResponse(7L, TransferStatus.PENDING, OffsetDateTime.parse("2026-11-12T10:00:00+09:00")));

        mockMvc.perform(post("/api/v1/teacher/students/12/transfer-requests")
                        .header("Authorization", bearer(2, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.createdAt").value("2026-11-12T10:00:00+09:00"));
    }

    @Test
    void 토큰이_없으면_401_학습자는_403() throws Exception {
        mockMvc.perform(post("/api/v1/teacher/students/12/transfer-requests")
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/teacher/students/12/transfer-requests")
                        .header("Authorization", bearer(12, Role.STUDENT))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/teacher/transfer-requests/7/accept")
                        .header("Authorization", bearer(12, Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    void toLoginId가_비면_400() throws Exception {
        mockMvc.perform(post("/api/v1/teacher/students/12/transfer-requests")
                        .header("Authorization", bearer(2, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"toLoginId\":\" \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void 기다리는_신청이_있으면_409_TRANSFER_ALREADY_PENDING() throws Exception {
        when(transferService.create(2L, 12L, "teacher2")).thenThrow(new ApiException(ErrorCode.TRANSFER_ALREADY_PENDING));

        mockMvc.perform(post("/api/v1/teacher/students/12/transfer-requests")
                        .header("Authorization", bearer(2, Role.TEACHER))
                        .contentType(MediaType.APPLICATION_JSON).content(BODY))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_ALREADY_PENDING"));
    }

    @Test
    void 수락은_204() throws Exception {
        mockMvc.perform(post("/api/v1/teacher/transfer-requests/7/accept")
                        .header("Authorization", bearer(3, Role.TEACHER)))
                .andExpect(status().isNoContent());
        verify(transferService).accept(3L, 7L);
    }

    @Test
    void 이미_처리된_신청은_409_TRANSFER_NOT_PENDING_없는_번호는_404() throws Exception {
        doThrow(new ApiException(ErrorCode.TRANSFER_NOT_PENDING)).when(transferService).accept(3L, 7L);
        doThrow(new ApiException(ErrorCode.NOT_FOUND)).when(transferService).accept(3L, 404L);

        mockMvc.perform(post("/api/v1/teacher/transfer-requests/7/accept")
                        .header("Authorization", bearer(3, Role.TEACHER)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_NOT_PENDING"));
        mockMvc.perform(post("/api/v1/teacher/transfer-requests/404/accept")
                        .header("Authorization", bearer(3, Role.TEACHER)))
                .andExpect(status().isNotFound());
    }
}
