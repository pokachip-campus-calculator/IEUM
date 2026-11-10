package com.ieum.record.service;

import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeType;
import com.ieum.record.dto.RecordListResponse.Compare;
import com.ieum.record.entity.PracticeRecord;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.List;

/**
 * [역할] 학습 기록을 보여 줄 모양으로 바꾼다: UNIT의 compare(사전·사후 비교), EMOTION의 emotion(단서·마음 문구).
 * [동작] content_json의 id를 answers_json에 담긴 선택지 id와 맞춰 문구로 바꾼다. 못 찾는 id는 건너뛴다.
 * [연결] RecordService(11), 이음쌤 학습자 상세(18)가 쓴다 / Practice, PracticeRecord
 * [주의] UNIT이 아니면 compare는, EMOTION이 아니면 emotion은 항상 null이다. 점수는 다루지 않는다.
 */
@Component
public class RecordViewMapper {

    private final JsonMapper jsonMapper;

    public RecordViewMapper(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    // UNIT이고 사전·사후 답이 모두 있을 때만. 사전·사후 둘 다 답한 문항만 content 순서대로 담는다
    public List<Compare> compare(Practice p, PracticeRecord r) {
        if (p.getType() != PracticeType.UNIT) return null;
        JsonNode answers = read(r.getAnswersJson());
        JsonNode pre = answers.path("pre");
        JsonNode post = answers.path("post");
        if (!pre.isObject() || !post.isObject() || pre.isEmpty() || post.isEmpty()) return null;

        List<Compare> result = new ArrayList<>();
        for (JsonNode q : read(p.getContentJson()).path("questions")) {
            String qid = q.path("id").asString(null);
            if (qid == null) continue;
            String thenLabel = optionLabel(q.path("options"), pre.path(qid));
            String nowLabel = optionLabel(q.path("options"), post.path(qid));
            if (thenLabel == null || nowLabel == null) continue;
            result.add(new Compare(qid, q.path("text").asString(""), thenLabel, nowLabel,
                    !pre.path(qid).asString().equals(post.path(qid).asString())));
        }
        return result.isEmpty() ? null : result;
    }

    // EMOTION이고 고른 단서·마음이 하나라도 있을 때만
    public EmotionView emotion(Practice p, PracticeRecord r) {
        if (p.getType() != PracticeType.EMOTION) return null;
        JsonNode content = read(p.getContentJson());
        JsonNode answers = read(r.getAnswersJson());
        List<String> clues = labels(content.path("clues"), answers.path("clues"));
        List<String> feelings = labels(content.path("feelings"), answers.path("feelings"));
        return clues.isEmpty() && feelings.isEmpty() ? null : new EmotionView(clues, feelings);
    }

    // 답한 선택지 id의 문구. 답이 없거나 content에 없는 id면 null
    private String optionLabel(JsonNode options, JsonNode optionId) {
        if (!optionId.isString()) return null;
        for (JsonNode o : options) {
            if (optionId.asString().equals(o.path("id").asString(null))) {
                return o.path("label").asString(null);
            }
        }
        return null;
    }

    // id 배열을 candidates 목록(clues·feelings)과 맞춰 문구로 바꾼다. content에 없는 id는 건너뛴다
    private List<String> labels(JsonNode candidates, JsonNode ids) {
        List<String> result = new ArrayList<>();
        for (JsonNode id : ids) {
            if (!id.isString()) continue;
            for (JsonNode c : candidates) {
                if (id.asString().equals(c.path("id").asString(null))) {
                    result.add(c.path("label").asString(null));
                    break;
                }
            }
        }
        return result;
    }

    private JsonNode read(String json) {
        if (json == null || json.isBlank()) return jsonMapper.createObjectNode();
        return jsonMapper.readTree(json);
    }

    /** 고른 단서·마음의 문구 목록(id가 아니라 label). */
    public record EmotionView(List<String> clues, List<String> feelings) {}
}
