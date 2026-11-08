package com.ieum.signal.repository;

import com.ieum.signal.entity.SignalKeyword;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] signal_keywords 테이블 조회·저장 통로. */
public interface SignalKeywordRepository extends JpaRepository<SignalKeyword, Long> {
}
