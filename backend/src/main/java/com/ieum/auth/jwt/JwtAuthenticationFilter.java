package com.ieum.auth.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * [역할] 요청의 Authorization: Bearer 토큰을 읽어 로그인 사용자로 등록한다.
 * [동작] 토큰이 올바르고 그 계정이 DB에 있으면 AuthUser와 ROLE_권한을 SecurityContext에 넣고, 아니면 아무것도 넣지 않고 다음으로 넘긴다.
 * [연결] SecurityConfig가 필터 체인에 붙인다 / JwtProvider, AccountChecker
 * [주의] 여기서는 401을 직접 내지 않는다. 로그인이 필요한 경로에서 인증이 비어 있으면 SecurityErrorHandler가 UNAUTHORIZED를 낸다.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtProvider jwtProvider;
    private final AccountChecker accountChecker;

    public JwtAuthenticationFilter(JwtProvider jwtProvider, AccountChecker accountChecker) {
        this.jwtProvider = jwtProvider;
        this.accountChecker = accountChecker;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER)) {
            jwtProvider.parse(header.substring(BEARER.length()).trim())
                    .filter(user -> accountChecker.exists(user.id()))   // 탈퇴한 계정의 토큰이면 인증을 비워 401로 보낸다
                    .ifPresent(user -> {
                var auth = new UsernamePasswordAuthenticationToken(
                        user, null, List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name())));
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }
        chain.doFilter(request, response);
    }
}
