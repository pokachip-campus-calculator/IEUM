package com.ieum.auth.jwt;

import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** [역할] 계정 확인 결과 기억(30초)이 DB 조회를 줄이면서도 탈퇴 직후에는 바로 막는지 확인한다. */
class AccountCheckerTest {

    private UserRepository userRepository;
    private long nowMillis;
    private AccountChecker checker;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        nowMillis = 1_000_000L;
        Clock clock = new Clock() {
            @Override public ZoneOffset getZone() { return ZoneOffset.UTC; }
            @Override public Clock withZone(java.time.ZoneId zone) { return this; }
            @Override public Instant instant() { return Instant.ofEpochMilli(nowMillis); }
        };
        checker = new AccountChecker(userRepository, clock);
    }

    @Test
    void 있는_계정은_30초_안에는_DB를_다시_조회하지_않는다() {
        when(userRepository.existsById(1L)).thenReturn(true);
        assertTrue(checker.exists(1L));
        nowMillis += 29_000L;
        assertTrue(checker.exists(1L));
        assertTrue(checker.exists(1L));
        verify(userRepository, times(1)).existsById(1L);
    }

    @Test
    void 기억_시간이_지나면_다시_조회한다() {
        when(userRepository.existsById(1L)).thenReturn(true);
        checker.exists(1L);
        nowMillis += AccountChecker.TTL_MILLIS + 1;
        checker.exists(1L);
        verify(userRepository, times(2)).existsById(1L);
    }

    @Test
    void 없는_계정은_기억하지_않고_매번_조회해_false다() {
        when(userRepository.existsById(2L)).thenReturn(false);
        assertFalse(checker.exists(2L));
        assertFalse(checker.exists(2L));
        verify(userRepository, times(2)).existsById(2L);
    }

    @Test
    void 탈퇴로_forget하면_기억_안이라도_바로_false다() {
        when(userRepository.existsById(3L)).thenReturn(true);
        assertTrue(checker.exists(3L));
        when(userRepository.existsById(3L)).thenReturn(false);   // 탈퇴로 행이 지워짐
        checker.forget(3L);
        assertFalse(checker.exists(3L));
    }
}
