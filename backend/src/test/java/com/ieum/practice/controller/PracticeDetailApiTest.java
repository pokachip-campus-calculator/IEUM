package com.ieum.practice.controller;

import com.ieum.auth.jwt.AllAccountsExistConfig;
import org.springframework.context.annotation.Import;
import com.ieum.auth.jwt.JwtProvider;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.entity.RecordStatus;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.user.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.PlatformTransactionManager;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 연습 상세(09)·진행 저장(10)의 권한, 기록 유무, done/restart 규칙, answers 검증을 DB 없이 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AllAccountsExistConfig.class)
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234"})
class PracticeDetailApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean PracticeRepository practiceRepository;
    @MockitoBean PracticeRecordRepository recordRepository;
    @MockitoBean PlatformTransactionManager transactionManager;

    // 1 UNIT(질문 8·카드 5), 2 SCENARIO, 3 EMOTION, 4 비공개
    private Practice unit, scenario, emotion, hidden;

    @BeforeEach
    void setUp() throws IOException {
        unit = practice(1, PracticeType.UNIT, PracticeArea.SAFETY, "practice-1.json", true);
        scenario = practice(2, PracticeType.SCENARIO, PracticeArea.HELP, "practice-2.json", true);
        emotion = practice(3, PracticeType.EMOTION, PracticeArea.EMOTION, "practice-3.json", true);
        hidden = practice(4, PracticeType.UNIT, PracticeArea.SAFETY, "practice-1.json", false);
        for (Practice p : new Practice[]{unit, scenario, emotion, hidden}) {
            when(practiceRepository.findById(p.getId())).thenReturn(Optional.of(p));
        }
        when(recordRepository.findByUserIdAndPracticeId(any(), any())).thenReturn(Optional.empty());
        when(recordRepository.saveAndFlush(any(PracticeRecord.class))).thenAnswer(i -> i.getArgument(0));
    }

    // ---------- 09 ----------

    @Test
    void 상세는_토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/practices/1")).andExpect(status().isUnauthorized());
    }

    @Test
    void 상세는_이음쌤이면_403() throws Exception {
        mockMvc.perform(get("/api/v1/practices/1").header("Authorization", bearer(2L, Role.TEACHER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void 기록이_없으면_record는_null이고_content가_함께_내려온다() throws Exception {
        mockMvc.perform(get("/api/v1/practices/1").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.type").value("UNIT"))
                .andExpect(jsonPath("$.area").value("SAFETY"))
                .andExpect(jsonPath("$.estMinutes").value(10))
                .andExpect(jsonPath("$.content.questions.length()").value(8))
                .andExpect(jsonPath("$.content.cards.length()").value(5))
                .andExpect(jsonPath("$.record").isEmpty());
    }

    @Test
    void 기록이_있으면_status_answers_myNote_시각이_내려온다() throws Exception {
        PracticeRecord r = new PracticeRecord(1L, 2L, "{\"choice\":\"c2\"}");
        ReflectionTestUtils.setField(r, "updatedAt", LocalDateTime.of(2026, 11, 4, 10, 30));
        r.saveProgress("{\"choice\":\"c2\"}", "메모");
        when(recordRepository.findByUserIdAndPracticeId(1L, 2L)).thenReturn(Optional.of(r));

        mockMvc.perform(get("/api/v1/practices/2").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.record.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.record.answers.choice").value("c2"))
                .andExpect(jsonPath("$.record.myNote").value("메모"))
                .andExpect(jsonPath("$.record.updatedAt").value("2026-11-04T10:30:00+09:00"))
                .andExpect(jsonPath("$.record.completedAt").isEmpty());
    }

    @Test
    void 없거나_비공개인_연습은_404() throws Exception {
        mockMvc.perform(get("/api/v1/practices/4").header("Authorization", student()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mockMvc.perform(get("/api/v1/practices/999").header("Authorization", student()))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/v1/practices/4/record").header("Authorization", student())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNotFound());
    }

    // ---------- 10: 공통 ----------

    @Test
    void 저장은_이음쌤이면_403() throws Exception {
        save(2, Role.TEACHER, "{\"answers\":{\"choice\":\"c1\"}}").andExpect(status().isForbidden());
        verify(recordRepository, never()).saveAndFlush(any());
    }

    @Test
    void done_false는_진행_저장이고_기록이_없으면_새로_만든다() throws Exception {
        save(2, "{\"answers\":{\"choice\":\"c2\"},\"myNote\":\"내 일 같아서\",\"done\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.answers.choice").value("c2"))
                .andExpect(jsonPath("$.myNote").value("내 일 같아서"))
                .andExpect(jsonPath("$.completedAt").isEmpty());
        PracticeRecord saved = savedRecord();
        assertEquals(1L, saved.getUserId());
        assertEquals(2L, saved.getPracticeId());
        assertEquals(RecordStatus.IN_PROGRESS, saved.getStatus());
        assertNull(saved.getCompletedAt());
    }

    @Test
    void 이미_있는_기록은_덮어쓴다() throws Exception {
        PracticeRecord r = new PracticeRecord(1L, 2L, "{\"choice\":\"c1\"}");
        when(recordRepository.findByUserIdAndPracticeId(1L, 2L)).thenReturn(Optional.of(r));
        save(2, "{\"answers\":{\"choice\":\"c3\",\"feelings\":[\"f1\"]}}").andExpect(status().isOk());
        assertEquals("{\"choice\":\"c3\",\"feelings\":[\"f1\"]}", savedRecord().getAnswersJson());
        assertEquals(r, savedRecord());
    }

    @Test
    void myNote는_시나리오에서만_저장하고_500자까지() throws Exception {
        save(1, "{\"answers\":{},\"myNote\":\"무시돼야 함\"}")
                .andExpect(jsonPath("$.myNote").isEmpty());
        save(2, "{\"answers\":{\"choice\":\"c1\"},\"myNote\":\"" + "가".repeat(501) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("myNote"));
        save(2, "{\"answers\":{\"choice\":\"c1\"},\"myNote\":\"" + "가".repeat(500) + "\"}")
                .andExpect(status().isOk());
    }

    // ---------- 10: done ----------

    @Test
    void 시나리오는_choice가_있어야_마칠_수_있다() throws Exception {
        save(2, "{\"answers\":{\"feelings\":[\"f1\"]},\"done\":true}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("RECORD_INCOMPLETE"));
        verify(recordRepository, never()).saveAndFlush(any());

        save(2, "{\"answers\":{\"choice\":\"c2\"},\"done\":true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.completedAt").value(org.hamcrest.Matchers.endsWith("+09:00")));
        assertNotNull(savedRecord().getCompletedAt());
    }

    @Test
    void UNIT은_사전_카드_사후를_모두_채워야_마칠_수_있다() throws Exception {
        String pre = unitAnswers(8, 8, 5);
        save(1, "{\"answers\":" + unitAnswers(7, 8, 5) + ",\"done\":true}")
                .andExpect(jsonPath("$.code").value("RECORD_INCOMPLETE"));
        save(1, "{\"answers\":" + unitAnswers(8, 4, 5) + ",\"done\":true}")
                .andExpect(jsonPath("$.code").value("RECORD_INCOMPLETE"));
        save(1, "{\"answers\":" + unitAnswers(8, 8, 4) + ",\"done\":true}")
                .andExpect(jsonPath("$.code").value("RECORD_INCOMPLETE"));
        save(1, "{\"answers\":" + pre + ",\"done\":true}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"));
    }

    @Test
    void 감정_읽기는_단서와_마음_합쳐_1개_이상이면_마칠_수_있다() throws Exception {
        save(3, "{\"answers\":{},\"done\":true}").andExpect(jsonPath("$.code").value("RECORD_INCOMPLETE"));
        save(3, "{\"answers\":{\"clues\":[],\"feelings\":[]},\"done\":true}")
                .andExpect(jsonPath("$.code").value("RECORD_INCOMPLETE"));
        save(3, "{\"answers\":{\"clues\":[\"k1\"]},\"done\":true}").andExpect(jsonPath("$.status").value("DONE"));
        save(3, "{\"answers\":{\"feelings\":[\"f5\"]},\"done\":true}").andExpect(jsonPath("$.status").value("DONE"));
    }

    @Test
    void 마친_기록은_restart_없이는_바뀌지_않는다() throws Exception {
        PracticeRecord r = new PracticeRecord(1L, 2L, "{\"choice\":\"c1\"}");
        r.complete(LocalDateTime.of(2026, 11, 1, 9, 0));
        when(recordRepository.findByUserIdAndPracticeId(1L, 2L)).thenReturn(Optional.of(r));

        save(2, "{\"answers\":{\"choice\":\"c3\"},\"done\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.answers.choice").value("c1"));
        verify(recordRepository, never()).saveAndFlush(any());
    }

    // ---------- 10: restart ----------

    @Test
    void restart는_답과_메모를_비우고_진행_중으로_되돌리되_completedAt은_남긴다() throws Exception {
        PracticeRecord r = new PracticeRecord(1L, 2L, "{\"choice\":\"c1\"}");
        r.saveProgress("{\"choice\":\"c1\"}", "메모");
        r.complete(LocalDateTime.of(2026, 11, 1, 9, 0));
        when(recordRepository.findByUserIdAndPracticeId(1L, 2L)).thenReturn(Optional.of(r));

        // 다른 필드(잘못된 answers 포함)는 무시한다
        save(2, "{\"restart\":true,\"done\":true,\"answers\":{\"nope\":1},\"myNote\":\"무시\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.answers").isEmpty())
                .andExpect(jsonPath("$.myNote").isEmpty())
                .andExpect(jsonPath("$.completedAt").value(org.hamcrest.Matchers.endsWith("+09:00")));
        assertEquals(RecordStatus.IN_PROGRESS, r.getStatus());
        assertEquals("{}", r.getAnswersJson());
        assertNull(r.getMyNote());
        assertEquals(LocalDateTime.of(2026, 11, 1, 9, 0), r.getCompletedAt());
    }

    // ---------- 10: answers 검증 ----------

    @Test
    void content에_없는_id는_VALIDATION_FAILED() throws Exception {
        save(2, "{\"answers\":{\"choice\":\"c9\"}}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("answers.choice"));
        save(2, "{\"answers\":{\"choice\":\"c1\",\"feelings\":[\"f99\"]}}")
                .andExpect(jsonPath("$.fieldErrors[0].field").value("answers.feelings"));
        save(3, "{\"answers\":{\"clues\":[\"k99\"]}}").andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        save(1, "{\"answers\":{\"pre\":{\"q99\":\"a\"}}}").andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        save(1, "{\"answers\":{\"pre\":{\"q1\":\"z\"}}}").andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        save(1, "{\"answers\":{\"cardsRead\":[6]}}").andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        save(1, "{\"answers\":{\"choice\":\"c1\"}}").andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        verify(recordRepository, never()).saveAndFlush(any());
    }

    @Test
    void 잘_모르겠어요는_다른_마음과_함께_고를_수_없다() throws Exception {
        save(3, "{\"answers\":{\"feelings\":[\"f1\",\"f5\"]}}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("answers.feelings"));
        save(3, "{\"answers\":{\"feelings\":[\"f1\",\"f2\"]}}").andExpect(status().isOk());
        save(3, "{\"answers\":{\"feelings\":[\"f5\"]}}").andExpect(status().isOk());
    }

    // ---------- 도구 ----------

    private ResultActions save(long practiceId, String body) throws Exception {
        return save(practiceId, Role.STUDENT, body);
    }

    private ResultActions save(long practiceId, Role role, String body) throws Exception {
        return mockMvc.perform(put("/api/v1/practices/" + practiceId + "/record")
                .header("Authorization", bearer(role == Role.STUDENT ? 1L : 2L, role))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private PracticeRecord savedRecord() {
        ArgumentCaptor<PracticeRecord> captor = ArgumentCaptor.forClass(PracticeRecord.class);
        verify(recordRepository, org.mockito.Mockito.atLeastOnce()).saveAndFlush(captor.capture());
        return captor.getValue();
    }

    // 사전 pre개·사후 post개 문항에 답하고 카드를 cards장 읽은 UNIT answers (선택지는 모두 "a")
    private static String unitAnswers(int pre, int post, int cards) {
        return "{\"pre\":" + answered(pre) + ",\"post\":" + answered(post) + ",\"cardsRead\":" + cardList(cards) + "}";
    }

    private static String answered(int n) {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 1; i <= n; i++) {
            sb.append(i > 1 ? "," : "").append("\"q").append(i).append("\":\"a\"");
        }
        return sb.append("}").toString();
    }

    private static String cardList(int n) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 1; i <= n; i++) {
            sb.append(i > 1 ? "," : "").append(i);
        }
        return sb.append("]").toString();
    }

    private String student() { return bearer(1L, Role.STUDENT); }

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    private static Practice practice(long id, PracticeType type, PracticeArea area, String contentFile, boolean published)
            throws IOException {
        String content;
        try (var in = PracticeDetailApiTest.class.getResourceAsStream("/practice-content/" + contentFile)) {
            content = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        Practice p = BeanUtils.instantiateClass(Practice.class);
        ReflectionTestUtils.setField(p, "id", id);
        ReflectionTestUtils.setField(p, "type", type);
        ReflectionTestUtils.setField(p, "area", area);
        ReflectionTestUtils.setField(p, "topic", "소분류");
        ReflectionTestUtils.setField(p, "level", 1);
        ReflectionTestUtils.setField(p, "title", "제목" + id);
        ReflectionTestUtils.setField(p, "summary", "요약");
        ReflectionTestUtils.setField(p, "estMinutes", 10);
        ReflectionTestUtils.setField(p, "contentJson", content);
        ReflectionTestUtils.setField(p, "sortOrder", 1);
        ReflectionTestUtils.setField(p, "published", published);
        return p;
    }
}
