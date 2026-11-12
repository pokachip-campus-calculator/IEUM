package com.ieum.record.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.record.dto.RecordListResponse;
import com.ieum.record.dto.RecordListResponse.Item;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.entity.RecordStatus;
import com.ieum.record.repository.PracticeRecordRepository;
import com.ieum.user.entity.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * [역할] 내 학습 기록 목록(11)을 만든다.
 * [동작] 내 practice_records를 공개된 연습 정보와 묶어 거르고 updated_at 기준으로 정렬한다. DONE은 completed_at이 있는 기록(다시 하는 중 포함), IN_PROGRESS는 status가 하는 중인 기록이다.
 *        UNIT은 사전(pre)·사후(post) 답이 모두 있을 때 문항별 선택지 문구로 compare를 채운다.
 * [연결] RecordController가 부른다 / PracticeRecordRepository, PracticeRepository
 * [주의] 학습자 전용이다. 비공개(published=0)이거나 사라진 연습의 기록은 목록에서 뺀다. 개수는 필터와 무관하게 전체 기준이고
 *        점수는 계산하지 않는다(달라졌는지만 changed).
 */
@Service
public class RecordService {

    private final PracticeRecordRepository recordRepository;
    private final PracticeRepository practiceRepository;
    private final RecordViewMapper recordViewMapper;
    private final Clock clock;

    public RecordService(PracticeRecordRepository recordRepository, PracticeRepository practiceRepository,
                         RecordViewMapper recordViewMapper, Clock clock) {
        this.recordRepository = recordRepository;
        this.practiceRepository = practiceRepository;
        this.recordViewMapper = recordViewMapper;
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

        // 완료는 completed_at이 남아 있는 기록이다(다시 하는 중이어도 포함). 하는 중은 status가 IN_PROGRESS인 기록이라 둘에 함께 잡힐 수 있다
        int doneCount = (int) visible.stream().filter(PracticeRecord::hasCompleted).count();
        int inProgressCount = (int) visible.stream().filter(r -> r.getStatus() == RecordStatus.IN_PROGRESS).count();

        // 최신순이 기본. 같은 시각이면 기록 id가 큰(나중에 만든) 것이 먼저
        Comparator<PracticeRecord> order = Comparator.comparing(PracticeRecord::getUpdatedAt)
                .thenComparing(PracticeRecord::getId);
        if (!oldFirst) {
            order = order.reversed();
        }
        List<Item> items = visible.stream()
                .filter(r -> statusFilter == null
                        || (statusFilter == RecordStatus.DONE ? r.hasCompleted() : r.getStatus() == RecordStatus.IN_PROGRESS))
                .sorted(order)
                .map(r -> toItem(r, practices.get(r.getPracticeId())))
                .toList();
        return new RecordListResponse(doneCount, inProgressCount, items);
    }

    private Item toItem(PracticeRecord r, Practice p) {
        return new Item(p.getId(), p.getTitle(), p.getType(), p.getArea(), p.getLevel(), r.getStatus(),
                toOffset(r.getCompletedAt()), toOffset(r.getUpdatedAt()), recordViewMapper.compare(p, r));
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
}
