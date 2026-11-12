package com.ieum.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.Duration;
import java.time.ZoneId;

/**
 * [역할] 서버가 "지금"을 한국 시간으로 읽는 시계를 등록한다.
 * [동작] 서비스는 LocalDateTime.now() 대신 이 Clock을 받아 쓴다.
 * [연결] AuthService(01·02) 등 시각·나이 계산이 필요한 서비스 / 테스트에서는 고정 시계로 바꿔 끼운다
 */
@Configuration
public class TimeConfig {

    @Bean
    public Clock clock() {
        // DB의 DATETIME은 초 단위로 저장되므로 시계도 초 단위로 맞춰, 저장 전 응답과 이후 조회의 시각이 같게 한다(#91)
        return Clock.tick(Clock.system(ZoneId.of("Asia/Seoul")), Duration.ofSeconds(1));
    }
}
