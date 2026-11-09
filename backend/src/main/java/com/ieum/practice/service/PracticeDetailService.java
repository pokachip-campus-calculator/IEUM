package com.ieum.practice.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.practice.dto.PracticeDetailResponse;
import com.ieum.practice.dto.PracticeDetailResponse.RecordView;
import com.ieum.practice.dto.SaveRecordRequest;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeType;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.entity.RecordStatus;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.user.entity.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * [역할] 연습 상세(09)와 진행 저장·마침(10)을 처리한다.
 * [동작] 09는 연습 정보·content와 내 기록을 한 번에 만든다. 10은 answers를 content와 맞춰 검사한 뒤
 *        done:false면 IN_PROGRESS, done:true면 필수 선택을 확인하고 DONE+completed_at, restart:true면 처음 상태로 되돌린다(completed_at은 남긴다).
 * [연결] PracticeDetailController가 부른다 / PracticeRepository, PracticeRecordRepository
 * [주의] 학습자 전용이다. published=0인 연습은 NOT_FOUND다. 점수·채점은 하지 않는다.
 *        이미 DONE인 기록은 restart로만 되돌리므로, restart 없는 저장 요청은 기록을 바꾸지 않고 현재 기록을 돌려준다.
 */
@Service
public class PracticeDetailService {

    private static final int NOTE_MAX = 500;

    private final PracticeRepository practiceRepository;
    private final PracticeRecordRepository recordRepository;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    public PracticeDetailService(PracticeRepository practiceRepository, PracticeRecordRepository recordRepository,
                                 JsonMapper jsonMapper, Clock clock) {
        this.practiceRepository = practiceRepository;
        this.recordRepository = recordRepository;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public PracticeDetailResponse detail(Long userId, Role role, Long practiceId) {
        requireStudent(role);
        Practice p = findPublished(practiceId);
        RecordView record = recordRepository.findByUserIdAndPracticeId(userId, practiceId)
                .map(this::toView).orElse(null);
        return new PracticeDetailResponse(p.getId(), p.getType(), p.getArea().apiName(), p.getTopic(), p.getLevel(),
                p.getTitle(), p.getSummary(), p.getEstMinutes(), parse(p.getContentJson()), record);
    }

    @Transactional
    public RecordView saveRecord(Long userId, Role role, Long practiceId, SaveRecordRequest request) {
        requireStudent(role);
        Practice p = findPublished(practiceId);
        PracticeRecord record = recordRepository.findByUserIdAndPracticeId(userId, practiceId).orElse(null);

        if (request.isRestart()) {   // 다른 필드는 무시
            if (record == null) {
                record = new PracticeRecord(userId, practiceId, "{}");
            } else {
                record.restart();
            }
            return toView(recordRepository.saveAndFlush(record));
        }

        JsonNode answers = request.answers() == null || request.answers().isNull()
                ? jsonMapper.createObjectNode() : request.answers();
        if (!answers.isObject()) {
            throw ApiException.invalid("answers", "answers는 객체여야 합니다.");
        }
        String myNote = noteFor(p.getType(), request.myNote());
        JsonNode content = parse(p.getContentJson());
        switch (p.getType()) {
            case UNIT -> checkUnit(content, answers, request.isDone());
            case SCENARIO -> checkScenario(content, answers, request.isDone());
            case EMOTION -> checkEmotion(content, answers, request.isDone());
        }

        if (record != null && record.getStatus() == RecordStatus.DONE) {
            return toView(record);   // DONE은 restart로만 되돌린다
        }
        String answersJson = jsonMapper.writeValueAsString(answers);
        if (record == null) {
            record = new PracticeRecord(userId, practiceId, answersJson);
        }
        record.saveProgress(answersJson, myNote);
        if (request.isDone()) {
            record.complete(LocalDateTime.now(clock));
        }
        return toView(recordRepository.saveAndFlush(record));
    }

    // ---------- 검사: 유형별 answers ----------

    /** UNIT: { pre: {qid: optionId}, cardsRead: [1..], post: {qid: optionId} } */
    private void checkUnit(JsonNode content, JsonNode answers, boolean done) {
        onlyKeys(answers, Set.of("pre", "cardsRead", "post"));
        JsonNode questions = content.path("questions");
        int cardCount = content.path("cards").size();
        int preCount = checkUnitAnswers(questions, answers.get("pre"), "answers.pre");
        int postCount = checkUnitAnswers(questions, answers.get("post"), "answers.post");

        Set<Integer> cards = new HashSet<>();
        JsonNode cardsRead = answers.get("cardsRead");
        if (cardsRead != null && !cardsRead.isNull()) {
            if (!cardsRead.isArray()) {
                throw ApiException.invalid("answers.cardsRead", "cardsRead는 카드 번호 목록이어야 합니다.");
            }
            for (JsonNode n : cardsRead) {
                if (!n.isInt() || n.intValue() < 1 || n.intValue() > cardCount) {
                    throw ApiException.invalid("answers.cardsRead", "없는 카드 번호입니다.");
                }
                cards.add(n.intValue());
            }
        }
        if (done && (preCount < questions.size() || cards.size() < cardCount || postCount < questions.size())) {
            throw new ApiException(ErrorCode.RECORD_INCOMPLETE);
        }
    }

    // 문항 id와 선택지 id가 content에 있는지 확인하고 답한 문항 수를 돌려준다
    private int checkUnitAnswers(JsonNode questions, JsonNode given, String field) {
        if (given == null || given.isNull()) return 0;
        if (!given.isObject()) {
            throw ApiException.invalid(field, "문항 id별 선택지 id 객체여야 합니다.");
        }
        int count = 0;
        for (Map.Entry<String, JsonNode> e : given.properties()) {
            JsonNode question = findById(questions, e.getKey());
            if (question == null) {
                throw ApiException.invalid(field, "없는 문항입니다: " + e.getKey());
            }
            if (!e.getValue().isString() || findById(question.path("options"), e.getValue().asString()) == null) {
                throw ApiException.invalid(field, "없는 선택지입니다: " + e.getKey());
            }
            count++;
        }
        return count;
    }

    /** SCENARIO: { choice: "c1", feelings: ["f1"] } */
    private void checkScenario(JsonNode content, JsonNode answers, boolean done) {
        onlyKeys(answers, Set.of("choice", "feelings"));
        JsonNode choice = answers.get("choice");
        boolean hasChoice = choice != null && !choice.isNull();
        if (hasChoice && (!choice.isString() || findById(content.path("choices"), choice.asString()) == null)) {
            throw ApiException.invalid("answers.choice", "없는 선택지입니다.");
        }
        checkIds(content.path("feelings"), answers.get("feelings"), "answers.feelings");
        if (done && !hasChoice) {
            throw new ApiException(ErrorCode.RECORD_INCOMPLETE);
        }
    }

    /** EMOTION: { clues: ["k1"], feelings: ["f1"] } — exclusive 마음은 단독으로만 */
    private void checkEmotion(JsonNode content, JsonNode answers, boolean done) {
        onlyKeys(answers, Set.of("clues", "feelings"));
        int clues = checkIds(content.path("clues"), answers.get("clues"), "answers.clues");
        int feelings = checkIds(content.path("feelings"), answers.get("feelings"), "answers.feelings");
        if (feelings > 1) {
            for (JsonNode id : answers.get("feelings")) {
                JsonNode feeling = findById(content.path("feelings"), id.asString());
                if (feeling != null && feeling.path("exclusive").asBoolean(false)) {
                    throw ApiException.invalid("answers.feelings", "“" + feeling.path("label").asString()
                            + "”은 다른 마음과 함께 고를 수 없어요.");
                }
            }
        }
        if (done && clues + feelings < 1) {
            throw new ApiException(ErrorCode.RECORD_INCOMPLETE);
        }
    }

    // id 문자열 배열이 content 목록에 모두 있는지 확인하고 (중복 뺀) 개수를 돌려준다
    private int checkIds(JsonNode candidates, JsonNode given, String field) {
        if (given == null || given.isNull()) return 0;
        if (!given.isArray()) {
            throw ApiException.invalid(field, "id 목록이어야 합니다.");
        }
        Set<String> seen = new HashSet<>();
        for (JsonNode n : given) {
            if (!n.isString() || findById(candidates, n.asString()) == null) {
                throw ApiException.invalid(field, "content에 없는 id입니다.");
            }
            seen.add(n.asString());
        }
        return seen.size();
    }

    private void onlyKeys(JsonNode answers, Set<String> allowed) {
        for (Map.Entry<String, JsonNode> e : answers.properties()) {
            if (!allowed.contains(e.getKey())) {
                throw ApiException.invalid("answers." + e.getKey(), "이 연습에서 쓰지 않는 항목입니다.");
            }
        }
    }

    private JsonNode findById(JsonNode list, String id) {
        for (JsonNode n : list) {
            if (id.equals(n.path("id").asString(null))) return n;
        }
        return null;
    }

    // ---------- 공통 ----------

    // myNote는 SCENARIO에서만 저장(500자까지), 다른 유형은 무시
    private String noteFor(PracticeType type, String myNote) {
        if (type != PracticeType.SCENARIO || myNote == null) return null;
        if (myNote.length() > NOTE_MAX) {
            throw ApiException.invalid("myNote", "500자 이하로 적어 주세요.");
        }
        return myNote;
    }

    private void requireStudent(Role role) {
        if (role != Role.STUDENT) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
    }

    private Practice findPublished(Long id) {
        return practiceRepository.findById(id).filter(Practice::isPublished)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private RecordView toView(PracticeRecord r) {
        return new RecordView(r.getStatus(), parse(r.getAnswersJson()), r.getMyNote(),
                toOffset(r.getUpdatedAt()), toOffset(r.getCompletedAt()));
    }

    private OffsetDateTime toOffset(LocalDateTime t) {
        return t == null ? null : t.atZone(clock.getZone()).toOffsetDateTime();
    }

    private JsonNode parse(String json) {
        if (json == null || json.isBlank()) return jsonMapper.createObjectNode();
        return jsonMapper.readTree(json);
    }
}
