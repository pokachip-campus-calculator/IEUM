package com.ieum.auth.service;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

/**
 * [역할] 같은 로그인 아이디로 비밀번호를 연속해서 틀린 횟수를 세고, 5회가 되면 5분간 로그인을 막는다.
 * [동작] 실패 횟수를 서버 메모리에 아이디별로 기억한다. 존재하지 않는 아이디도 똑같이 세어 계정 존재 여부를 알리지 않는다.
 *        마지막 실패로부터 5분이 지나면 횟수는 0으로 돌아가고, 로그인에 성공하면 바로 지운다.
 * [연결] AuthService.login이 부른다 / Clock(테스트에서 시각을 고정한다) / DB 없음
 * [주의] 서버를 다시 띄우면 기억이 사라지고, 서버가 여러 대면 서버마다 따로 센다(1대 기준). 5회·5분은 아래 상수 두 곳만 고친다.
 *        기억하는 아이디가 너무 많아지면 만료된 것부터 비운다(메모리가 무한히 늘지 않게).
 */
@Component
public class LoginAttemptLimiter {

    static final int MAX_FAILURES = 5;
    static final long LOCK_MILLIS = 5 * 60_000L;
    private static final int PURGE_THRESHOLD = 10_000;

    private record Attempt(int failures, long lastFailureAt, long lockedUntil) {}

    private final Clock clock;
    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

    public LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    // 지금 잠겨 있으면 true (맞는 비밀번호여도 로그인시키지 않는다)
    public boolean isLocked(String loginId) {
        Attempt a = attempts.get(loginId);
        return a != null && a.lockedUntil() > clock.millis();
    }

    // 비밀번호가 틀렸을 때 부른다. 5번째 실패에서 잠금이 시작된다
    public void recordFailure(String loginId) {
        long now = clock.millis();
        if (attempts.size() > PURGE_THRESHOLD) {
            attempts.values().removeIf(a -> now - a.lastFailureAt() >= LOCK_MILLIS);
        }
        attempts.compute(loginId, (id, prev) -> {
            int failures = (prev == null || now - prev.lastFailureAt() >= LOCK_MILLIS) ? 1 : prev.failures() + 1;
            long lockedUntil = failures >= MAX_FAILURES ? now + LOCK_MILLIS : 0L;
            return new Attempt(failures, now, lockedUntil);
        });
    }

    // 로그인 아이디·비밀번호가 맞았을 때 부른다
    public void clear(String loginId) {
        attempts.remove(loginId);
    }
}
