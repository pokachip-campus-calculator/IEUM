package com.ieum.home.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.home.dto.HomeResponse;
import com.ieum.home.service.HomeService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 학습자 홈 07 GET /home 요청을 받는다.
 * [동작] 토큰의 사용자 id로 본인 홈 데이터만 만든다.
 * [연결] 화면 S05 / HomeService
 * [주의] 실제 주소는 /api/v1/home 이다. 학습자만 쓸 수 있다(이음쌤은 403).
 */
@RestController
@ConditionalOnProperty(name = "mock.learning.enabled", havingValue = "false")   // 기본은 mock(#58). 실제 07·08을 쓰려면 mock.learning.enabled=false
@RequestMapping("/home")
public class HomeController {

    private final HomeService homeService;

    public HomeController(HomeService homeService) {
        this.homeService = homeService;
    }

    @GetMapping
    public HomeResponse home(@AuthenticationPrincipal AuthUser user) {
        return homeService.home(user.id());
    }
}
