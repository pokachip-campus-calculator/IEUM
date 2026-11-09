package com.ieum.practice.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.practice.dto.PracticeItem;
import com.ieum.practice.dto.PracticeItem.MyStatus;
import com.ieum.practice.dto.PracticeListResponse;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.user.entity.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * [역할] 연습 목록(08)을 만들고, 홈(07)이 같은 카드 모양을 쓰도록 변환·정렬 기능을 함께 제공한다.
 * [동작] 공개된 연습만 영역→단계→sort_order 순으로 정렬하고, 로그인한 사용자의 기록으로 myStatus를 붙인다.
 * [연결] PracticeController, HomeService가 부른다 / PracticeRepository, PracticeRecordRepository
 * [주의] 학습자 전용이다. 이음쌤 배정(teacher_id)과 무관하다. 연습 수가 적어 조건 걸러내기는 자바에서 한다.
 */
@Service
public class PracticeService {

    /** 영역 순서(SAFETY→HELP→EMOTION)는 enum 선언 순서를 따른다. */
    private static final Comparator<Practice> LIST_ORDER = Comparator
            .comparing(Practice::getArea)
            .thenComparingInt(Practice::getLevel)
            .thenComparingInt(Practice::getSortOrder)
            .thenComparing(Practice::getId);

    private final PracticeRepository practiceRepository;
    private final PracticeRecordRepository recordRepository;
    private final Clock clock;

    public PracticeService(PracticeRepository practiceRepository, PracticeRecordRepository recordRepository, Clock clock) {
        this.clock = clock;
        this.practiceRepository = practiceRepository;
        this.recordRepository = recordRepository;
    }

    @Transactional(readOnly = true)
    public PracticeListResponse list(Long userId, Role role, String area, String level, String q) {
        if (role != Role.STUDENT) {
            throw new ApiException(ErrorCode.FORBIDDEN);   // 기준서 API 목록: 08은 학습자만
        }
        PracticeArea areaFilter = parseArea(area);
        Integer levelFilter = parseLevel(level);
        String keyword = (q == null || q.isBlank()) ? null : q.strip().toLowerCase(Locale.ROOT);

        Map<Long, PracticeRecord> records = recordsByPractice(userId);
        List<PracticeItem> items = practiceRepository.findByPublishedTrue().stream()
                .filter(p -> areaFilter == null || p.getArea() == areaFilter)
                .filter(p -> levelFilter == null || p.getLevel() == levelFilter)
                .filter(p -> keyword == null
                        || p.getTitle().toLowerCase(Locale.ROOT).contains(keyword)
                        || p.getSummary().toLowerCase(Locale.ROOT).contains(keyword))
                .sorted(LIST_ORDER)
                .map(p -> toItem(p, records.get(p.getId())))
                .toList();
        return new PracticeListResponse(items);
    }

    /** 사용자의 기록을 연습 id로 찾기 쉽게 모은다. */
    public Map<Long, PracticeRecord> recordsByPractice(Long userId) {
        return recordRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(PracticeRecord::getPracticeId, Function.identity()));
    }

    public Comparator<Practice> listOrder() { return LIST_ORDER; }

    public PracticeItem toItem(Practice p, PracticeRecord record) {
        return new PracticeItem(p.getId(), p.getType(), p.getArea(), p.getTopic(), p.getLevel(),
                p.getTitle(), p.getSummary(), p.getEstMinutes(),
                MyStatus.of(record == null ? null : record.getStatus()),
                record == null || record.getCompletedAt() == null ? null : toOffset(record.getCompletedAt()));
    }

    // DB의 한국 시간 값에 +09:00을 붙여 내린다
    private OffsetDateTime toOffset(LocalDateTime t) {
        return t.atZone(clock.getZone()).toOffsetDateTime();
    }

    private PracticeArea parseArea(String area) {
        if (area == null || area.isBlank()) return null;
        try {
            return PracticeArea.valueOf(area.strip());
        } catch (IllegalArgumentException e) {
            throw ApiException.invalid("area", "area는 SAFETY, HELP, EMOTION 중 하나여야 합니다.");
        }
    }

    private Integer parseLevel(String level) {
        if (level == null || level.isBlank()) return null;
        try {
            return Integer.valueOf(level.strip());
        } catch (NumberFormatException e) {
            throw ApiException.invalid("level", "level은 숫자여야 합니다.");
        }
    }
}
