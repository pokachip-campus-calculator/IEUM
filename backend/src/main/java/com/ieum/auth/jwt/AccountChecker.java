package com.ieum.auth.jwt;

import com.ieum.user.repository.UserRepository;
import org.springframework.stereotype.Component;

/**
 * [역할] 토큰에 담긴 사용자 id의 계정이 지금도 DB에 있는지 확인한다.
 * [동작] users에서 id로 존재 여부만 조회한다(탈퇴 06은 계정을 지우므로 없으면 탈퇴한 계정이다).
 * [연결] JwtAuthenticationFilter가 요청마다 부른다 / UserRepository
 * [주의] 요청마다 조회 1회가 늘어난다. 테스트에서는 이 빈을 바꿔 끼워 DB 없이 돌린다.
 */
@Component
public class AccountChecker {

    private final UserRepository userRepository;

    public AccountChecker(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 해당 메서드에서 사용자의 ID 가 존재하는 치 SQL Query 를 발생시킨다.
    // where user_id = userId;
    // user_id 컬럼에 index
    public boolean exists(Long userId) {
        return userRepository.existsById(userId);
    }
}
