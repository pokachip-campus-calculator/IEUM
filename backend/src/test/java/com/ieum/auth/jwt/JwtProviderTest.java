package com.ieum.auth.jwt;

import com.ieum.user.entity.Role;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** [역할] 토큰 발급·검증(올바른 토큰, 위조, 만료, 짧은 비밀키)을 확인한다. */
class JwtProviderTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-1234";

    @Test
    void 발급한_토큰에서_id와_role을_꺼낼_수_있다() {
        JwtProvider provider = new JwtProvider(SECRET, 7);

        String token = provider.issue(5L, Role.TEACHER);

        assertThat(provider.parse(token)).contains(new AuthUser(5L, Role.TEACHER));
    }

    @Test
    void 다른_키로_서명한_토큰은_거부한다() {
        String token = new JwtProvider(SECRET, 7).issue(1L, Role.STUDENT);
        JwtProvider other = new JwtProvider("other-secret-other-secret-other-secret-99", 7);

        assertThat(other.parse(token)).isEmpty();
    }

    @Test
    void 만료된_토큰은_거부한다() {
        JwtProvider provider = new JwtProvider(SECRET, -1);

        assertThat(provider.parse(provider.issue(1L, Role.STUDENT))).isEmpty();
    }

    @Test
    void 형식이_틀린_토큰은_거부한다() {
        assertThat(new JwtProvider(SECRET, 7).parse("abc.def.ghi")).isEmpty();
    }

    @Test
    void 비밀키가_32바이트보다_짧으면_서버가_뜨지_않는다() {
        assertThatThrownBy(() -> new JwtProvider("short", 7)).isInstanceOf(IllegalStateException.class);
    }
}
