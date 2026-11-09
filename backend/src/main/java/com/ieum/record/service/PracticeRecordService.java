package com.ieum.record.service;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PracticeRecordService {

    private final PracticeRecordRepository recordRepository;
    private final PracticeRepository practiceRepository;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    public PracticeRecordService(PracticeRecordRepository recordRepository, PracticeRepository practiceRepository,
                                 JsonMapper jsonMapper, Clock clock) {
        this.recordRepository = recordRepository;
        this.practiceRepository = practiceRepository;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public RecordList list(AuthUser user, String statusValue, String sort) {
        if (user.role() != Role.STUDENT) throw new ApiException(ErrorCode.FORBIDDEN);
        RecordStatus status = parseStatus(statusValue);
        if (sort != null && !sort.isBlank() && !sort.equals("recent") && !sort.equals("old")) {
            throw ApiException.invalid("sort", "sort는 recent 또는 old여야 합니다.");
        }

        List<ApiRecord> all = recordRepository.findByUserId(user.id()).stream()
                .map(record -> practiceRepository.findById(record.getPracticeId())
                        .filter(Practice::isPublished)
                        .map(practice -> toApiRecord(practice, record))
                        .orElse(null))
                .filter(record -> record != null)
                .toList();
        long doneCount = all.stream().filter(record -> record.status() == RecordStatus.DONE).count();
        long inProgressCount = all.stream().filter(record -> record.status() == RecordStatus.IN_PROGRESS).count();
        Comparator<ApiRecord> byDate = Comparator.comparing(
                record -> record.completedAt() == null ? record.updatedAt() : record.completedAt());
        List<ApiRecord> filtered = new ArrayList<>(all.stream()
                .filter(record -> status == null || record.status() == status)
                .toList());
        filtered.sort("old".equals(sort) ? byDate : byDate.reversed());
        return new RecordList(doneCount, inProgressCount, filtered);
    }

    private ApiRecord toApiRecord(Practice practice, PracticeRecord record) {
        List<CompareItem> compare = practice.getType() == PracticeType.UNIT
                ? unitComparison(practice, record)
                : List.of();
        return new ApiRecord(practice.getId(), practice.getTitle(), practice.getArea().apiName(), practice.getLevel(),
                record.getStatus(), toOffset(record.getCompletedAt()), toOffset(record.getUpdatedAt()),
                record.getMyNote(), compare);
    }

    private List<CompareItem> unitComparison(Practice practice, PracticeRecord record) {
        JsonNode content = readJson(practice.getContentJson());
        JsonNode answers = readJson(record.getAnswersJson());
        JsonNode pre = answers.path("pre");
        JsonNode post = answers.path("post");
        List<CompareItem> rows = new ArrayList<>();
        for (JsonNode question : content.path("questions")) {
            String id = question.path("id").asString(null);
            if (id == null) continue;
            String before = answerLabel(question, pre.path(id));
            String after = answerLabel(question, post.path(id));
            if (before != null || after != null) {
                rows.add(new CompareItem(question.path("text").asString(""), before, after));
            }
        }
        return rows;
    }

    private String answerLabel(JsonNode question, JsonNode answer) {
        if (!answer.isString()) return null;
        String answerId = answer.asString();
        for (JsonNode option : question.path("options")) {
            if (answerId.equals(option.path("id").asString(null))) {
                return option.path("label").asString("");
            }
        }
        return null;
    }

    private JsonNode readJson(String value) {
        if (value == null || value.isBlank()) return jsonMapper.createObjectNode();
        return jsonMapper.readTree(value);
    }

    private RecordStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return RecordStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("status", "status는 DONE 또는 IN_PROGRESS여야 합니다.");
        }
    }

    private OffsetDateTime toOffset(LocalDateTime value) {
        return value == null ? null : value.atZone(clock.getZone()).toOffsetDateTime();
    }

    public record RecordList(long doneCount, long inProgressCount, List<ApiRecord> items) {}
    public record ApiRecord(Long practiceId, String title, String area, int level, RecordStatus status,
                            OffsetDateTime completedAt, OffsetDateTime updatedAt, String myNote,
                            List<CompareItem> compare) {}
    public record CompareItem(String text, String then, String now) {}
}
