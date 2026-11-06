/* comment. 테스트용 로그인 건너뛰기 작업
     * [역할] 서버의 보안 규칙(접근 허용, CORS, 비밀번호 암호화)을 한곳에서 설정한다.
     * [동작] 모든 요청을 로그인 없이 통과시키고, 프런트(React) 호출을 허용하며, BCrypt 암호화기를 등록한다.
     * [연결] 회원가입·로그인 API(01·02)가 PasswordEncoder를 가져다 쓴다. 나중에 JWT 필터가 여기에 붙는다.
     * [주의] 지금은 anyRequest().permitAll()이라 권한 구분이 없다. JWT를 붙일 때 /auth/**만 열고 나머지는 막도록 바꿀 것.
     * CORS의 "*"는 시연용이라 배포 때 배포(Vercel 등) 주소로 좁힌다.
 */

package com.ieum.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)                 // JWT 방식이라 CSRF 불필요
                .cors(Customizer.withDefaults())                       // 아래 CORS 설정 사용
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)            // 기본 로그인 창 끄기
                .httpBasic(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()                          // 지금은 전부 열어 둠
                );
        return http.build();
    }

    // 비밀번호 암호화용 (회원가입·로그인에서 사용)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 프런트(React)에서 백엔드를 호출할 수 있게 허용
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));             // 시연용: 모든 출처 허용
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}