package com.ieum.practice.repository;

import com.ieum.practice.entity.Practice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** [역할] practices 테이블 조회·저장 통로. */
public interface PracticeRepository extends JpaRepository<Practice, Long> {

    // 공개된 연습만. 정렬·검색 조건은 서비스에서 적용한다
    List<Practice> findByPublishedTrue();
}
