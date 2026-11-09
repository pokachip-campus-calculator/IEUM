package com.ieum.practice.controller;

import com.ieum.auth.jwt.JwtProvider;
import com.ieum.message.entity.SenderRole;
import com.ieum.message.repository.MessageRepository;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.entity.PracticeType;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** [역할] 홈(07)·연습 목록(08)의 로그인 필요 여부, 정렬·필터·resume 규칙, 응답 모양을 DB 없이 확인한다. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {"jwt.secret=test-secret-test-secret-test-secret-1234", "mock.learning.enabled=false"})
class PracticeHomeApiTest {

    @Autowired MockMvc mockMvc;
    @Autowired JwtProvider jwtProvider;
    @MockitoBean UserRepository userRepository;
    @MockitoBean PracticeRepository practiceRepository;
    @MockitoBean PracticeRecordRepository recordRepository;
    @MockitoBean MessageRepository messageRepository;
    @MockitoBean PlatformTransactionManager transactionManager;

    // 연습 4개: 1 SAFETY L1, 2 SAFETY L2, 3 HELP L1(시나리오), 4 EMOTION L1
    private final Practice p1 = practice(1, PracticeType.UNIT, PracticeArea.SAFETY, 1, "안전 기본", "낯선 사람 대처");
    private final Practice p2 = practice(2, PracticeType.UNIT, PracticeArea.SAFETY, 2, "안전 심화", "Online 친구");
    private final Practice p3 = practice(3, PracticeType.SCENARIO, PracticeArea.HELP, 1, "도움 요청", "어른에게 말하기");
    private final Practice p4 = practice(4, PracticeType.EMOTION, PracticeArea.EMOTION, 1, "감정 읽기", "표정 단서");

    @BeforeEach
    void setUp() {
        mockUser(1L, Role.STUDENT, "길동");
        mockUser(2L, Role.TEACHER, "김 이음쌤");
        // 일부러 섞인 순서로 돌려줘서 서비스가 정렬하는지 확인한다
        when(practiceRepository.findByPublishedTrue()).thenReturn(List.of(p4, p3, p2, p1));
        when(recordRepository.findByUserId(any())).thenReturn(List.of());
        when(messageRepository.countUnreadReplies(1L, SenderRole.TEACHER)).thenReturn(2L);
    }

    @Test
    void 연습_목록은_토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/v1/practices")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/home")).andExpect(status().isUnauthorized());
    }

    @Test
    void 연습_목록은_영역_단계_순으로_items에_담고_content는_없다() throws Exception {
        mockMvc.perform(get("/api/v1/practices").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].id").value(1))
                .andExpect(jsonPath("$.items[1].id").value(2))
                .andExpect(jsonPath("$.items[2].id").value(3))
                .andExpect(jsonPath("$.items[3].id").value(4))
                .andExpect(jsonPath("$.items[0].myStatus").value("NONE"))
                .andExpect(jsonPath("$.items[0].estMinutes").value(10))
                .andExpect(jsonPath("$.items[0].content").doesNotExist())
                .andExpect(jsonPath("$.items[0].contentJson").doesNotExist());
    }

    @Test
    void area_level_q는_모두_선택_조건이고_q는_대소문자를_가리지_않는다() throws Exception {
        String auth = bearer(1L, Role.STUDENT);
        mockMvc.perform(get("/api/v1/practices?area=SAFETY").header("Authorization", auth))
                .andExpect(jsonPath("$.items.length()").value(2));
        mockMvc.perform(get("/api/v1/practices?level=1").header("Authorization", auth))
                .andExpect(jsonPath("$.items.length()").value(3));
        mockMvc.perform(get("/api/v1/practices?area=SAFETY&level=2").header("Authorization", auth))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(2));
        mockMvc.perform(get("/api/v1/practices?q=ONLINE").header("Authorization", auth))   // summary의 "Online"
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(2));
        mockMvc.perform(get("/api/v1/practices?q=도움").header("Authorization", auth))     // title
                .andExpect(jsonPath("$.items[0].id").value(3));
    }

    @Test
    void 잘못된_area나_level은_400() throws Exception {
        mockMvc.perform(get("/api/v1/practices?area=NOPE").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("area"));
        mockMvc.perform(get("/api/v1/practices?level=abc").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("level"));
    }

    @Test
    void 내_기록으로_myStatus가_붙는다() throws Exception {
        when(recordRepository.findByUserId(1L)).thenReturn(List.of(
                record(1L, 1L, false, LocalDateTime.now(), null),
                record(1L, 3L, true, LocalDateTime.now(), LocalDateTime.now())));
        mockMvc.perform(get("/api/v1/practices").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(jsonPath("$.items[0].myStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.items[1].myStatus").value("NONE"))
                .andExpect(jsonPath("$.items[2].myStatus").value("DONE"));
    }

    @Test
    void 홈_기록이_없으면_resume은_안_한_연습의_첫_번째() throws Exception {
        mockMvc.perform(get("/api/v1/home").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("길동"))
                .andExpect(jsonPath("$.unreadMessages").value(2))
                .andExpect(jsonPath("$.doneTotal").value(0))
                .andExpect(jsonPath("$.resume.practiceId").value(1))
                .andExpect(jsonPath("$.resume.title").value("안전 기본"))
                .andExpect(jsonPath("$.resume.type").value("UNIT"))
                .andExpect(jsonPath("$.resume.area").value("SAFETY"))
                .andExpect(jsonPath("$.resume.level").value(1))
                .andExpect(jsonPath("$.resume.estMinutes").value(10))
                .andExpect(jsonPath("$.resume.status").value("NONE"))
                .andExpect(jsonPath("$.inProgress.length()").value(0))
                .andExpect(jsonPath("$.recent.length()").value(0))
                .andExpect(jsonPath("$.areas.length()").value(3))
                .andExpect(jsonPath("$.areas[0].area").value("SAFETY"))
                .andExpect(jsonPath("$.areas[0].doneCount").value(0))
                .andExpect(jsonPath("$.areas[0].total").doesNotExist());
    }

    @Test
    void 홈_하는_중인_것이_있으면_가장_최근_것이_resume이고_나머지는_inProgress() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        when(recordRepository.findByUserId(1L)).thenReturn(List.of(
                record(1L, 1L, false, now.minusDays(2), null),
                record(1L, 2L, false, now.minusDays(1), null),
                record(1L, 3L, false, now.minusHours(1), null)));
        mockMvc.perform(get("/api/v1/home").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(jsonPath("$.resume.practiceId").value(3))
                .andExpect(jsonPath("$.resume.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.inProgress.length()").value(2))
                .andExpect(jsonPath("$.inProgress[0].practiceId").value(2))
                .andExpect(jsonPath("$.inProgress[0].title").value("안전 심화"))
                .andExpect(jsonPath("$.inProgress[0].area").value("SAFETY"))
                .andExpect(jsonPath("$.inProgress[0].level").value(2))
                .andExpect(jsonPath("$.inProgress[1].practiceId").value(1));
    }

    @Test
    void 홈_모두_마쳤으면_resume은_null이고_recent는_최신_3개() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        when(recordRepository.findByUserId(1L)).thenReturn(List.of(
                record(1L, 1L, true, now.minusDays(4), now.minusDays(4)),
                record(1L, 2L, true, now.minusDays(3), now.minusDays(3)),
                record(1L, 3L, true, now.minusDays(2), now.minusDays(2)),
                record(1L, 4L, true, now.minusDays(1), now.minusDays(1))));
        mockMvc.perform(get("/api/v1/home").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(jsonPath("$.resume").isEmpty())
                .andExpect(jsonPath("$.doneTotal").value(4))
                .andExpect(jsonPath("$.recent.length()").value(3))
                .andExpect(jsonPath("$.recent[0].practiceId").value(4))
                .andExpect(jsonPath("$.recent[0].title").value("감정 읽기"))
                .andExpect(jsonPath("$.recent[0].completedAt").value(org.hamcrest.Matchers.endsWith("+09:00")))
                .andExpect(jsonPath("$.recent[2].practiceId").value(2))
                .andExpect(jsonPath("$.areas[0].doneCount").value(2));
    }

    @Test
    void 다시_하는_중이어도_완료한_적_있으면_완료_수와_recent에_남는다() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        when(recordRepository.findByUserId(1L)).thenReturn(List.of(
                redoing(1L, 1L, now.minusHours(1), now.minusDays(2)),
                record(1L, 2L, true, now.minusDays(1), now.minusDays(1))));
        mockMvc.perform(get("/api/v1/home").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(jsonPath("$.resume.practiceId").value(1))
                .andExpect(jsonPath("$.resume.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.doneTotal").value(2))
                .andExpect(jsonPath("$.recent.length()").value(2))
                .andExpect(jsonPath("$.recent[1].practiceId").value(1))
                .andExpect(jsonPath("$.areas[0].doneCount").value(2));
    }

    @Test
    void 목록은_다시_하는_중인_연습에도_completedAt을_내린다() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        when(recordRepository.findByUserId(1L)).thenReturn(List.of(
                redoing(1L, 1L, now.minusHours(1), now.minusDays(2))));
        mockMvc.perform(get("/api/v1/practices").header("Authorization", bearer(1L, Role.STUDENT)))
                .andExpect(jsonPath("$.items[0].id").value(1))
                .andExpect(jsonPath("$.items[0].myStatus").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.items[0].completedAt").value(org.hamcrest.Matchers.endsWith("+09:00")))
                .andExpect(jsonPath("$.items[1].myStatus").value("NONE"))
                .andExpect(jsonPath("$.items[1].completedAt").isEmpty());
    }

    @Test
    void 연습_목록은_이음쌤_토큰이면_403() throws Exception {
        mockMvc.perform(get("/api/v1/practices").header("Authorization", bearer(2L, Role.TEACHER)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void 홈은_이음쌤_토큰이면_403() throws Exception {
        mockMvc.perform(get("/api/v1/home").header("Authorization", bearer(2L, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    private String bearer(long id, Role role) { return "Bearer " + jwtProvider.issue(id, role); }

    private void mockUser(long id, Role role, String nickname) {
        User u = new User("user" + id, "{noop}hash", role, UserStatus.ACTIVE, "이름", nickname, LocalDateTime.now());
        ReflectionTestUtils.setField(u, "id", id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
    }

    private static Practice practice(long id, PracticeType type, PracticeArea area, int level, String title, String summary) {
        Practice p = BeanUtils.instantiateClass(Practice.class);
        ReflectionTestUtils.setField(p, "id", id);
        ReflectionTestUtils.setField(p, "type", type);
        ReflectionTestUtils.setField(p, "area", area);
        ReflectionTestUtils.setField(p, "topic", "소분류");
        ReflectionTestUtils.setField(p, "level", level);
        ReflectionTestUtils.setField(p, "title", title);
        ReflectionTestUtils.setField(p, "summary", summary);
        ReflectionTestUtils.setField(p, "estMinutes", 10);
        ReflectionTestUtils.setField(p, "contentJson", "{}");
        ReflectionTestUtils.setField(p, "sortOrder", 1);
        ReflectionTestUtils.setField(p, "published", true);
        return p;
    }

    // 완료한 뒤 다시 하기를 눌러 진행 중으로 돌아간 기록 (completed_at은 남는다)
    private static PracticeRecord redoing(long userId, long practiceId, LocalDateTime updatedAt, LocalDateTime completedAt) {
        PracticeRecord r = record(userId, practiceId, true, updatedAt, completedAt);
        r.restart();
        ReflectionTestUtils.setField(r, "updatedAt", updatedAt);
        return r;
    }

    private static PracticeRecord record(long userId, long practiceId, boolean done, LocalDateTime updatedAt, LocalDateTime completedAt) {
        PracticeRecord r = new PracticeRecord(userId, practiceId, "{}");
        if (done) r.complete(completedAt);
        ReflectionTestUtils.setField(r, "updatedAt", updatedAt);
        return r;
    }
}
