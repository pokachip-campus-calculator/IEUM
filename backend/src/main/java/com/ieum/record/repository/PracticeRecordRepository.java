package com.ieum.record.repository;

import com.ieum.record.entity.PracticeRecord;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] practice_records 테이블 조회·저장 통로. */
public interface PracticeRecordRepository extends JpaRepository<PracticeRecord, Long> {
}
