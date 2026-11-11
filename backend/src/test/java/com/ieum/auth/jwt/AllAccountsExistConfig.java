package com.ieum.auth.jwt;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * [역할] 테스트에서 토큰의 계정이 DB에 항상 있는 것으로 보게 한다(DB 없이 필터를 통과시키기 위해).
 * [사용] 로그인 토큰을 쓰는 API 테스트에 @Import(AllAccountsExistConfig.class)로 붙인다. 탈퇴 토큰 테스트는 붙이지 않는다.
 */
@TestConfiguration
public class AllAccountsExistConfig {

    @Bean
    @Primary
    AccountChecker alwaysExistingAccountChecker() {
        return new AccountChecker(null) {
            @Override
            public boolean exists(Long userId) {
                return true;
            }
        };
    }
}
