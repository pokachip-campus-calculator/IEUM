package com.ieum.home.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.home.dto.HomeResponse;
import com.ieum.home.dto.HomeResponse.AreaProgress;
import com.ieum.home.dto.HomeResponse.InProgressItem;
import com.ieum.home.dto.HomeResponse.Resume;
import com.ieum.home.dto.HomeResponse.RecentItem;
import com.ieum.message.entity.SenderRole;
import com.ieum.message.repository.MessageRepository;
import com.ieum.practice.dto.PracticeItem.MyStatus;
import com.ieum.practice.entity.Practice;
import com.ieum.practice.entity.PracticeArea;
import com.ieum.practice.repository.PracticeRepository;
import com.ieum.practice.service.PracticeService;
import com.ieum.record.entity.PracticeRecord;
import com.ieum.record.entity.RecordStatus;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * [역할] 학습자 홈(07)에 필요한 값(닉네임·안 읽은 답장·이어하기·영역별 현황·최근 기록)을 모은다.
 * [동작] 공개된 연습과 내 기록만으로 계산한다(응답 모양은 기준서 3장 07). resume은 하는 중 가장 최근 것, 없으면 안 한 것의 첫 번째, 다 했으면 null이다. 완료 수·recent는 completed_at이 남은 기록 기준(다시 하는 중 포함)이다.
 * [연결] HomeController가 부른다 / PracticeService(카드 변환·정렬), MessageRepository(안 읽은 답장)
 * [주의] 학습자 전용이다. 이음쌤 배정(teacher_id)과 무관하게 동작한다.
 */
@Service
public class HomeService {

    private static final int IN_PROGRESS_MAX = 2;
    private static final int RECENT_MAX = 3;

    private final UserRepository userRepository;
    private final PracticeRepository practiceRepository;
    private final MessageRepository messageRepository;
    private final PracticeService practiceService;
    private final Clock clock;

    public HomeService(UserRepository userRepository, PracticeRepository practiceRepository,
                       MessageRepository messageRepository, PracticeService practiceService, Clock clock) {
        this.userRepository = userRepository;
        this.practiceRepository = practiceRepository;
        this.messageRepository = messageRepository;
        this.practiceService = practiceService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public HomeResponse home(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
        if (user.getRole() != Role.STUDENT) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        List<Practice> practices = practiceRepository.findByPublishedTrue().stream()
                .sorted(practiceService.listOrder())
                .toList();
        Map<Long, PracticeRecord> records = practiceService.recordsByPractice(userId);

        // 하는 중인 연습: 최근 수정 순
        List<Practice> inProgress = practices.stream()
                .filter(p -> statusOf(records.get(p.getId())) == RecordStatus.IN_PROGRESS)
                .sorted(Comparator.comparing((Practice p) -> records.get(p.getId()).getUpdatedAt()).reversed())
                .toList();

        Practice resume = !inProgress.isEmpty() ? inProgress.get(0)
                : practices.stream().filter(p -> records.get(p.getId()) == null).findFirst().orElse(null);

        List<InProgressItem> inProgressItems = inProgress.stream()
                .filter(p -> p != resume)
                .limit(IN_PROGRESS_MAX)
                .map(p -> new InProgressItem(p.getId(), p.getTitle(), p.getArea(), p.getLevel()))
                .toList();

        List<Practice> done = practices.stream()
                .filter(p -> records.get(p.getId()) != null && records.get(p.getId()).hasCompleted())   // 다시 하는 중이어도 완료한 적 있으면 포함
                .toList();

        List<RecentItem> recent = done.stream()
                .sorted(Comparator.comparing((Practice p) -> completedAt(records.get(p.getId()))).reversed())
                .limit(RECENT_MAX)
                .map(p -> new RecentItem(p.getId(), p.getTitle(), p.getArea(),
                        toOffset(records.get(p.getId()).getCompletedAt())))
                .toList();

        List<AreaProgress> areas = Arrays.stream(PracticeArea.values())
                .map(a -> new AreaProgress(a,
                        done.stream().filter(p -> p.getArea() == a).count()))
                .toList();

        long unread = messageRepository.countUnreadReplies(userId, SenderRole.TEACHER);

        return new HomeResponse(user.getNickname(), unread, done.size(),
                resume == null ? null : toResume(resume, records.get(resume.getId())),
                inProgressItems, areas, recent);
    }

    private Resume toResume(Practice p, PracticeRecord record) {
        return new Resume(p.getId(), p.getTitle(), p.getType(), p.getArea(), p.getLevel(), p.getEstMinutes(),
                MyStatus.of(record == null ? null : record.getStatus()));
    }

    // DB의 한국 시간 값에 +09:00을 붙여 내린다
    private OffsetDateTime toOffset(LocalDateTime t) {
        return t == null ? null : t.atZone(clock.getZone()).toOffsetDateTime();
    }

    private RecordStatus statusOf(PracticeRecord r) { return r == null ? null : r.getStatus(); }

    // completed_at이 비어 있는 이상 데이터는 맨 뒤로 보낸다
    private LocalDateTime completedAt(PracticeRecord r) {
        return r.getCompletedAt() != null ? r.getCompletedAt() : LocalDateTime.MIN;
    }
}
