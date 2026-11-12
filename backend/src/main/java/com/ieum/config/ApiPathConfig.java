package com.ieum.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * [역할] 모든 컨트롤러의 주소 앞에 기본 경로 /api/v1을 붙인다.
 * [동작] 컨트롤러에는 /auth/login처럼 뒷부분만 적고, 실제 주소는 /api/v1/auth/login이 된다.
 * [연결] 모든 @RestController / SecurityConfig의 접근 규칙이 /api/v1 기준이다
 * [주의] 기준서의 API 번호 주소는 /api/v1을 뺀 부분이다. 컨트롤러에 /api/v1을 또 적지 않는다.
 */
@Configuration
public class ApiPathConfig implements WebMvcConfigurer {

    public static final String BASE_PATH = "/api/v1";

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.addPathPrefix(BASE_PATH, HandlerTypePredicate.forAnnotation(RestController.class));
    }
}
