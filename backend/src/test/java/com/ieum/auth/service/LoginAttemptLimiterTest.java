package com.ieum.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

/** [역할] 로그인 실패 제한(5회 연속 실패 → 5분 잠금)의 횟수·시간 규칙을 DB 없이 확인한다. */
class LoginAttemptLimiterTest {

    // 테스트에서 시간을 직접 움직이는 시계
    static class MutableClock extends Clock {
        private long millis = Instant.parse("2026-11-12T00:00:00Z").toEpochMilli();

        void advance(long ms) { millis += ms; }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return Instant.ofEpochMilli(millis); }
    }

    private MutableClock clock;
    private LoginAttemptLimiter limiter;

    @BeforeEach
    void setUp() {
        clock = new MutableClock();
        limiter = new LoginAttemptLimiter(clock);
    }

    private void fail(String id, int times) {
        for (int i = 0; i < times; i++) {
            limiter.recordFailure(id);
        }
    }

    @Test
    void 네_번_틀려서는_잠기지_않고_다섯_번째에_잠긴다() {
        fail("user01", 4);
        assertThat(limiter.isLocked("user01")).isFalse();

        limiter.recordFailure("user01");
        assertThat(limiter.isLocked("user01")).isTrue();
    }

    @Test
    void 잠기고_5분이_지나면_풀린다() {
        fail("user01", 5);
        clock.advance(LoginAttemptLimiter.LOCK_MILLIS - 1);
        assertThat(limiter.isLocked("user01")).isTrue();

        clock.advance(1);
        assertThat(limiter.isLocked("user01")).isFalse();
    }

    @Test
    void 풀린_뒤에는_횟수가_0부터_다시_센다() {
        fail("user01", 5);
        clock.advance(LoginAttemptLimiter.LOCK_MILLIS);

        fail("user01", 4);
        assertThat(limiter.isLocked("user01")).isFalse();
        limiter.recordFailure("user01");
        assertThat(limiter.isLocked("user01")).isTrue();
    }

    @Test
    void 마지막_실패로부터_5분이_지나면_오래된_실패는_세지_않는다() {
        fail("user01", 4);
        clock.advance(LoginAttemptLimiter.LOCK_MILLIS);

        limiter.recordFailure("user01");
        assertThat(limiter.isLocked("user01")).isFalse();
    }

    @Test
    void 성공하면_횟수가_지워진다() {
        fail("user01", 4);
        limiter.clear("user01");

        fail("user01", 4);
        assertThat(limiter.isLocked("user01")).isFalse();
    }

    @Test
    void 아이디마다_따로_센다() {
        fail("user01", 5);

        assertThat(limiter.isLocked("user01")).isTrue();
        assertThat(limiter.isLocked("user02")).isFalse();
    }
}
