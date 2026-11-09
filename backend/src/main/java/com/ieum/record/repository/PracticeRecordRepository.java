package com.ieum.record.repository;

import com.ieum.record.entity.PracticeRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/** [역할] practice_records 테이블 조회·저장 통로. */
public interface PracticeRecordRepository extends JpaRepository<PracticeRecord, Long> {

    List<PracticeRecord> findByUserId(Long userId);

    // 학습자×연습당 1행
    Optional<PracticeRecord> findByUserIdAndPracticeId(Long userId, Long practiceId);
}
