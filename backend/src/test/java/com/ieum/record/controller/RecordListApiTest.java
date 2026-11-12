package com.ieum.record.controller;

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
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 학습 기록(11)의 권한, status·sort, 개수, UNIT compare 규칙을 DB 없이 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(AllAccountsExistConfig.class)
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234"})
class RecordListApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean PracticeRepository practiceRepository;
    @MockitoBean PracticeRecordRepository recordRepository;
    @MockitoBean PlatformTransactionManager transactionManager;

    // 1 UNIT(마침, 사전·사후 있음), 2 SCENARIO(하는 중), 3 UNIT(하는 중, 사전만), 4 비공개 UNIT(마침)
    @BeforeEach
    void setUp() throws IOException {
        Practice unit = practice(1, PracticeType.UNIT, PracticeArea.SAFETY, "practice-1.json", true);
        Practice scenario = practice(2, PracticeType.SCENARIO, PracticeArea.HELP, "practice-2.json", true);
        Practice unit2 = practice(3, PracticeType.UNIT, PracticeArea.SAFETY, "practice-1.json", true);
        Practice hidden = practice(4, PracticeType.UNIT, PracticeArea.SAFETY, "practice-1.json", false);
        when(practiceRepository.findAllById(anyIterable())).thenReturn(List.of(unit, scenario, unit2, hidden));

        PracticeRecord done = record(10, 1, RecordStatus.DONE,
                "{\"pre\":{\"q1\":\"c\",\"q2\":\"b\"},\"cardsRead\":[1,2,3,4,5],\"post\":{\"q1\":\"b\",\"q2\":\"b\"}}",
                LocalDateTime.of(2026, 10, 29, 15, 0), LocalDateTime.of(2026, 10, 29, 15, 0));
        PracticeRecord doing = record(11, 2, RecordStatus.IN_PROGRESS, "{\"choice\":\"c2\"}",
                null, LocalDateTime.of(2026, 10, 28, 11, 0));
        PracticeRecord preOnly = record(12, 3, RecordStatus.IN_PROGRESS, "{\"pre\":{\"q1\":\"c\"}}",
                null, LocalDateTime.of(2026, 10, 30, 9, 0));
        PracticeRecord hiddenDone = record(13, 4, RecordStatus.DONE, "{\"pre\":{\"q1\":\"c\"},\"post\":{\"q1\":\"b\"}}",
                LocalDateTime.of(2026, 10, 31, 9, 0), LocalDateTime.of(2026, 10, 31, 9, 0));
        when(recordRepository.findByUserId(anyLong())).thenReturn(List.of(done, doing, preOnly, hiddenDone));
    }

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/records")).andExpect(status().isUnauthorized());
    }

    @Test
    void 이음쌤이면_403() throws Exception {
        mockMvc.perform(get("/api/v1/records").header("Authorization", bearer(2L, Role.TEACHER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void 기본은_최신순이고_비공개_연습은_빠지며_개수가_함께_내려온다() throws Exception {
        mockMvc.perform(get("/api/v1/records").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doneCount").value(1))
                .andExpect(jsonPath("$.inProgressCount").value(2))
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].practiceId").value(3))
                .andExpect(jsonPath("$.items[1].practiceId").value(1))
                .andExpect(jsonPath("$.items[2].practiceId").value(2))
                .andExpect(jsonPath("$.items[1].title").value("제목1"))
                .andExpect(jsonPath("$.items[1].type").value("UNIT"))
                .andExpect(jsonPath("$.items[1].area").value("SAFETY"))
                .andExpect(jsonPath("$.items[1].status").value("DONE"))
                .andExpect(jsonPath("$.items[1].completedAt").value("2026-10-29T15:00:00+09:00"))
                .andExpect(jsonPath("$.items[1].updatedAt").value("2026-10-29T15:00:00+09:00"))
                .andExpect(jsonPath("$.items[2].completedAt").isEmpty());
    }

    @Test
    void sort_old는_오래된_순이다() throws Exception {
        mockMvc.perform(get("/api/v1/records").param("sort", "old").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].practiceId").value(2))
                .andExpect(jsonPath("$.items[2].practiceId").value(3));
    }

    @Test
    void status로_거르면_목록만_줄고_개수는_전체_기준이다() throws Exception {
        mockMvc.perform(get("/api/v1/records").param("status", "IN_PROGRESS").header("Authorization", student()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doneCount").value(1))
                .andExpect(jsonPath("$.inProgressCount").value(2))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.items[1].status").value("IN_PROGRESS"));
        mockMvc.perform(get("/api/v1/records").param("status", "DONE").header("Authorization", student()))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].practiceId").value(1));
    }

    @Test
    void 잘못된_status나_sort는_400() throws Exception {
        mockMvc.perform(get("/api/v1/records").param("status", "NONE").header("Authorization", student()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("status"));
        mockMvc.perform(get("/api/v1/records").param("sort", "x").header("Authorization", student()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("sort"));
    }

    @Test
    void UNIT은_사전_사후_답이_모두_있을_때만_문구로_compare를_채운다() throws Exception {
        mockMvc.perform(get("/api/v1/records").header("Authorization", student()))
                .andExpect(jsonPath("$.items[1].compare.length()").value(2))
                .andExpect(jsonPath("$.items[1].compare[0].questionId").value("q1"))
                .andExpect(jsonPath("$.items[1].compare[0].text").isNotEmpty())
                .andExpect(jsonPath("$.items[1].compare[0].then").value("잘 모르겠어요"))
                .andExpect(jsonPath("$.items[1].compare[0].now").value("보내지 않고 대화를 멈춘다"))
                .andExpect(jsonPath("$.items[1].compare[0].changed").value(true))
                .andExpect(jsonPath("$.items[1].compare[1].questionId").value("q2"))
                .andExpect(jsonPath("$.items[1].compare[1].changed").value(false));
    }

    @Test
    void 사후_답이_없는_UNIT이나_UNIT이_아닌_연습은_compare가_null() throws Exception {
        mockMvc.perform(get("/api/v1/records").header("Authorization", student()))
                .andExpect(jsonPath("$.items[0].compare").isEmpty())    // 3번 UNIT: 사전만
                .andExpect(jsonPath("$.items[2].compare").isEmpty());   // 2번 SCENARIO
    }

    private String student() { return bearer(1L, Role.STUDENT); }

    @Test
    void 다시_하는_중인_기록은_완료로도_세고_DONE_필터에도_나온다() throws Exception {
        PracticeRecord done = record(10, 1, RecordStatus.DONE, "{}",
                LocalDateTime.of(2026, 10, 29, 15, 0), LocalDateTime.of(2026, 10, 29, 15, 0));
        PracticeRecord redo = record(12, 3, RecordStatus.IN_PROGRESS, "{}",
                LocalDateTime.of(2026, 10, 20, 9, 0), LocalDateTime.of(2026, 10, 30, 9, 0));
        when(recordRepository.findByUserId(anyLong())).thenReturn(List.of(done, redo));

        mockMvc.perform(get("/api/v1/records").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.doneCount").value(2))
                .andExpect(jsonPath("$.inProgressCount").value(1));
        mockMvc.perform(get("/api/v1/records?status=DONE").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(jsonPath("$.items.length()").value(2));
        mockMvc.perform(get("/api/v1/records?status=IN_PROGRESS").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].practiceId").value(3))
                .andExpect(jsonPath("$.items[0].status").value("IN_PROGRESS"));
    }

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    private static PracticeRecord record(long id, long practiceId, RecordStatus status, String answers,
                                         LocalDateTime completedAt, LocalDateTime updatedAt) {
        PracticeRecord r = BeanUtils.instantiateClass(PracticeRecord.class);
        ReflectionTestUtils.setField(r, "id", id);
        ReflectionTestUtils.setField(r, "userId", 1L);
        ReflectionTestUtils.setField(r, "practiceId", practiceId);
        ReflectionTestUtils.setField(r, "status", status);
        ReflectionTestUtils.setField(r, "answersJson", answers);
        ReflectionTestUtils.setField(r, "startedAt", updatedAt);
        ReflectionTestUtils.setField(r, "updatedAt", updatedAt);
        ReflectionTestUtils.setField(r, "completedAt", completedAt);
        return r;
    }

    private static Practice practice(long id, PracticeType type, PracticeArea area, String contentFile, boolean published)
            throws IOException {
        String content;
        try (var in = RecordListApiTest.class.getResourceAsStream("/practice-content/" + contentFile)) {
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
