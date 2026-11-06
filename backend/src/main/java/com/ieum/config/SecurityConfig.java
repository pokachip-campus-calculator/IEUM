package com.ieum.config;

import com.ieum.auth.jwt.JwtAuthenticationFilter;
import com.ieum.auth.jwt.SecurityErrorHandler;
import com.ieum.user.entity.Role;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * [역할] 서버의 보안 규칙(접근 허용, JWT 필터, CORS, 비밀번호 암호화)을 한곳에서 설정한다.
 * [동작] /api/v1/auth/**만 공개, /api/v1/teacher/**는 이음쌤만, 나머지는 로그인한 사용자만 통과시킨다.
 * [연결] 회원가입·로그인 API(01·02)가 PasswordEncoder를 쓴다 / JwtAuthenticationFilter, SecurityErrorHandler
 * [주의] CORS 허용 주소는 CORS_ALLOWED_ORIGINS(쉼표로 구분)로 정한다. 기본값 *는 로컬 시연용이라 배포 때 Vercel 주소로 좁힌다.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtAuthenticationFilter jwtFilter,
                                           SecurityErrorHandler errorHandler) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)                 // JWT 방식이라 CSRF 불필요
                .cors(Customizer.withDefaults())                       // 아래 CORS 설정 사용
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)            // 기본 로그인 창 끄기
                .httpBasic(AbstractHttpConfigurer::disable)
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(errorHandler)        // 토큰 없음·만료 → UNAUTHORIZED
                        .accessDeniedHandler(errorHandler))            // 권한 없음 → FORBIDDEN
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()   // CORS 사전 요청
                        .requestMatchers(ApiPathConfig.BASE_PATH + "/auth/**").permitAll()
                        .requestMatchers(ApiPathConfig.BASE_PATH + "/teacher/**").hasRole(Role.TEACHER.name())
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // 비밀번호 암호화용 (회원가입·로그인에서 사용)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 프런트(React)에서 백엔드를 호출할 수 있게 허용
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins:*}") List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
