package com.ieum.record.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeType;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.dto.RecordListResponse;
import com.ieum.record.dto.RecordListResponse.Compare;
import com.ieum.record.dto.RecordListResponse.Item;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * [역할] 내 학습 기록 목록(11)을 만든다.
 * [동작] 내 practice_records를 공개된 연습 정보와 묶어 status로 거르고 updated_at 기준으로 정렬한다.
 *        UNIT은 사전(pre)·사후(post) 답이 모두 있을 때 문항별 선택지 문구로 compare를 채운다.
 * [연결] RecordController가 부른다 / PracticeRecordRepository, PracticeRepository
 * [주의] 학습자 전용이다. 비공개(published=0)이거나 사라진 연습의 기록은 목록에서 뺀다. 개수는 필터와 무관하게 전체 기준이고
 *        점수는 계산하지 않는다(달라졌는지만 changed).
 */
@Service
public class RecordService {

    private final PracticeRecordRepository recordRepository;
    private final PracticeRepository practiceRepository;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    public RecordService(PracticeRecordRepository recordRepository, PracticeRepository practiceRepository,
                         JsonMapper jsonMapper, Clock clock) {
        this.recordRepository = recordRepository;
        this.practiceRepository = practiceRepository;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public RecordListResponse list(Long userId, Role role, String status, String sort) {
        if (role != Role.STUDENT) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        RecordStatus statusFilter = parseStatus(status);
        boolean oldFirst = parseOldFirst(sort);

        List<PracticeRecord> records = recordRepository.findByUserId(userId);
        Map<Long, Practice> practices = practiceRepository
                .findAllById(records.stream().map(PracticeRecord::getPracticeId).distinct().toList()).stream()
                .filter(Practice::isPublished)
                .collect(Collectors.toMap(Practice::getId, Function.identity()));
        List<PracticeRecord> visible = records.stream()
                .filter(r -> practices.containsKey(r.getPracticeId()))
                .toList();

        int doneCount = (int) visible.stream().filter(r -> r.getStatus() == RecordStatus.DONE).count();
        int inProgressCount = visible.size() - doneCount;

        // 최신순이 기본. 같은 시각이면 기록 id가 큰(나중에 만든) 것이 먼저
        Comparator<PracticeRecord> order = Comparator.comparing(PracticeRecord::getUpdatedAt)
                .thenComparing(PracticeRecord::getId);
        if (!oldFirst) {
            order = order.reversed();
        }
        List<Item> items = visible.stream()
                .filter(r -> statusFilter == null || r.getStatus() == statusFilter)
                .sorted(order)
                .map(r -> toItem(r, practices.get(r.getPracticeId())))
                .toList();
        return new RecordListResponse(doneCount, inProgressCount, items);
    }

    private Item toItem(PracticeRecord r, Practice p) {
        return new Item(p.getId(), p.getTitle(), p.getType(), p.getArea(), p.getLevel(), r.getStatus(),
                toOffset(r.getCompletedAt()), toOffset(r.getUpdatedAt()), compare(p, r));
    }

    // UNIT이고 사전·사후 답이 모두 있을 때만. 사전·사후 둘 다 답한 문항만 content 순서대로 담는다
    private List<Compare> compare(Practice p, PracticeRecord r) {
        if (p.getType() != PracticeType.UNIT) return null;
        JsonNode answers = read(r.getAnswersJson());
        JsonNode pre = answers.path("pre");
        JsonNode post = answers.path("post");
        if (!pre.isObject() || !post.isObject() || pre.isEmpty() || post.isEmpty()) return null;

        List<Compare> result = new ArrayList<>();
        for (JsonNode q : read(p.getContentJson()).path("questions")) {
            String qid = q.path("id").asString(null);
            if (qid == null) continue;
            String thenLabel = label(q, pre.path(qid));
            String nowLabel = label(q, post.path(qid));
            if (thenLabel == null || nowLabel == null) continue;
            result.add(new Compare(qid, q.path("text").asString(""), thenLabel, nowLabel,
                    !pre.path(qid).asString().equals(post.path(qid).asString())));
        }
        return result.isEmpty() ? null : result;
    }

    // 답한 선택지 id의 문구. 답이 없거나 content에 없는 id면 null
    private String label(JsonNode question, JsonNode optionId) {
        if (!optionId.isString()) return null;
        for (JsonNode o : question.path("options")) {
            if (optionId.asString().equals(o.path("id").asString(null))) {
                return o.path("label").asString(null);
            }
        }
        return null;
    }

    private RecordStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return RecordStatus.valueOf(status.strip());
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("status", "status는 DONE, IN_PROGRESS 중 하나여야 합니다.");
        }
    }

    private boolean parseOldFirst(String sort) {
        if (sort == null || sort.isBlank() || sort.strip().equals("recent")) return false;
        if (sort.strip().equals("old")) return true;
        throw ApiException.invalid("sort", "sort는 recent, old 중 하나여야 합니다.");
    }

    private OffsetDateTime toOffset(LocalDateTime t) {
        return t == null ? null : t.atZone(clock.getZone()).toOffsetDateTime();
    }

    private JsonNode read(String json) {
        if (json == null || json.isBlank()) return jsonMapper.createObjectNode();
        return jsonMapper.readTree(json);
    }
}
