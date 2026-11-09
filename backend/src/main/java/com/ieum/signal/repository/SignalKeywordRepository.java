package com.ieum.signal.repository;

import com.ieum.signal.entity.MatchType;
import com.ieum.signal.entity.SignalKeyword;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** [역할] signal_keywords 테이블 조회·저장 통로. */
public interface SignalKeywordRepository extends JpaRepository<SignalKeyword, Long> {

    // 신호 검사에 쓰는 낱말(active=1)만 일치 방식별로 가져온다
    List<SignalKeyword> findByActiveTrueAndMatchType(MatchType matchType);
}
