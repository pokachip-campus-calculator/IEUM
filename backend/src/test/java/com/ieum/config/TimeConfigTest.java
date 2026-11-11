package com.ieum.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.ieum.signal.entity.SignalEvent;

import java.time.Clock;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/** #91: DB DATETIME(초 단위)과 같도록, 서버가 만드는 시각에는 소수점 이하가 없어야 한다. */
class TimeConfigTest {

    @Test
    void 서버_시계는_초_단위로_내려준다() {
        Clock clock = new TimeConfig().clock();

        for (int i = 0; i < 5; i++) {
            assertThat(LocalDateTime.now(clock).getNano()).isZero();
        }
    }

    @Test
    void 엔티티가_저장_전에_만드는_생성시각도_초_단위이다() {
        SignalEvent event = org.springframework.beans.BeanUtils.instantiateClass(SignalEvent.class);

        ReflectionTestUtils.invokeMethod(event, "onCreate");

        assertThat(event.getCreatedAt().getNano()).isZero();
    }
}
