package com.ieum.auth.jwt;

import com.ieum.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;

/**
 * [역할] 토큰에 담긴 사용자 id의 계정이 지금도 DB에 있는지 확인한다.
 * [동작] users에서 id로 존재 여부만 조회하되, "있다"는 결과는 30초 동안 기억해 같은 계정의 다음 요청은 DB를 거치지 않는다.
 *        "없다"는 결과는 기억하지 않는다(탈퇴한 계정의 토큰은 매번 확인해 계속 401로 막는다).
 * [연결] JwtAuthenticationFilter가 요청마다 부른다 / UserService.withdraw가 탈퇴 직후 forget을 부른다 / UserRepository
 * [주의] 탈퇴(06)는 forget으로 기억을 바로 지우므로 같은 서버에서는 탈퇴 직후 401이다. 서버가 여러 대가 되면 다른 서버는 최대 30초 늦게 알게 된다.
 *        existsById는 기본키(id) 조회라 이미 인덱스를 탄다. 느려진 원인은 조회 자체보다 요청마다 DB를 한 번 더 왕복하는 비용이다.
 *        테스트에서는 이 빈을 바꿔 끼워 DB 없이 돌린다.
 */
@Component
public class AccountChecker {

    static final long TTL_MILLIS = 30_000L;

    private final UserRepository userRepository;
    private final Clock clock;
    private final ConcurrentHashMap<Long, Long> verifiedUntil = new ConcurrentHashMap<>();   // userId -> 기억이 끝나는 시각(ms)

    @Autowired
    public AccountChecker(UserRepository userRepository) {
        this(userRepository, Clock.systemUTC());
    }

    AccountChecker(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.clock = clock;
    }

    // 해당 메서드에서 사용자의 ID 가 존재하는 치 SQL Query 를 발생시킨다.
    // where user_id = userId;
    // user_id 컬럼에 index
    public boolean exists(Long userId) {
        long now = clock.millis();
        Long until = verifiedUntil.get(userId);
        if (until != null && until > now) {
            return true;
        }
        if (userRepository.existsById(userId)) {
            verifiedUntil.put(userId, now + TTL_MILLIS);
            return true;
        }
        verifiedUntil.remove(userId);
        return false;
    }

    // 탈퇴한 계정은 기억에서 바로 지운다
    public void forget(Long userId) {
        verifiedUntil.remove(userId);
    }

    // 테스트에서 기억을 비울 때 쓴다
    public void clear() {
        verifiedUntil.clear();
    }
}
