package com.ieum.auth.jwt;

import com.ieum.user.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Date;
import java.util.Optional;

/**
 * [역할] 액세스 토큰 1개를 발급하고 검증한다.
 * [동작] 사용자 id와 role을 담아 HS256으로 서명하고, 검증에 실패하면 빈 값을 돌려준다.
 * [연결] 로그인 API(02)가 issue()를, JwtAuthenticationFilter가 parse()를 쓴다 / DB 없음
 * [주의] JWT_SECRET이 비어 있으면 실행 때마다 임시 키를 만든다(재시작하면 토큰 무효). 배포에서는 반드시 .env로 넣는다.
 */
@Component
public class JwtProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtProvider.class);
    private static final String ROLE_CLAIM = "role";

    private final SecretKey key;
    private final Duration validity;

    public JwtProvider(@Value("${jwt.secret:}") String secret,
                       @Value("${jwt.expiration-minutes:60}") long expirationMinutes) {
        this.key = Keys.hmacShaKeyFor(resolveSecret(secret));
        this.validity = Duration.ofMinutes(expirationMinutes);
    }

    // 비밀키는 32바이트 이상이어야 서명할 수 있다
    private static byte[] resolveSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            log.warn("JWT_SECRET이 비어 있어 임시 키를 사용합니다. 재시작하면 기존 토큰이 모두 무효가 됩니다.");
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            return random;
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET은 32바이트(영문 32자) 이상이어야 합니다.");
        }
        return bytes;
    }

    // 로그인 성공 시 토큰 발급
    public String issue(Long userId, Role role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(ROLE_CLAIM, role.name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + validity.toMillis()))
                .signWith(key)
                .compact();
    }

    // 만료 시각(응답의 expiresAt에 쓴다)
    public Date expiresAt(String token) {
        return claims(token).getExpiration();
    }

    // 올바른 토큰이면 사용자 정보를, 아니면(위조·만료·형식 오류) 빈 값을 돌려준다
    public Optional<AuthUser> parse(String token) {
        try {
            Claims claims = claims(token);
            return Optional.of(new AuthUser(Long.valueOf(claims.getSubject()), Role.valueOf(claims.get(ROLE_CLAIM, String.class))));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private Claims claims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
