package com.ieum.practice.repository;

import com.ieum.practice.entity.Practice;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] practices 테이블 조회·저장 통로. */
public interface PracticeRepository extends JpaRepository<Practice, Long> {
}
