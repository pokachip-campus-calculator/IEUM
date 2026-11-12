package com.ieum.user.controller;

import com.ieum.auth.jwt.AuthUser;
import com.ieum.user.dto.TeacherStudentDetailResponse;
import com.ieum.user.dto.TeacherStudentListResponse;
import com.ieum.user.dto.TeacherSummaryResponse;
import com.ieum.user.service.TeacherHomeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * [역할] 이음쌤 홈 16 GET /teacher/summary, 17 GET /teacher/students, 18 GET /teacher/students/{id}를 받는다.
 * [동작] 토큰의 사용자 id를 이음쌤 id로 써서 TeacherHomeService에 그대로 넘긴다.
 * [연결] 화면 T01·헤더 배지 / TeacherHomeService
 * [주의] /teacher/**는 SecurityConfig가 이음쌤만 통과시켜서 여기서 역할을 다시 확인하지 않는다.
 */
@RestController
@RequestMapping("/teacher")
public class TeacherController {

    private final TeacherHomeService teacherHomeService;

    public TeacherController(TeacherHomeService teacherHomeService) {
        this.teacherHomeService = teacherHomeService;
    }

    @GetMapping("/summary")
    public TeacherSummaryResponse summary(@AuthenticationPrincipal AuthUser user) {
        return teacherHomeService.summary(user.id());
    }

    @GetMapping("/students")
    public TeacherStudentListResponse students(@AuthenticationPrincipal AuthUser user,
                                               @RequestParam(required = false) String q,
                                               @RequestParam(required = false) String sort) {
        return teacherHomeService.students(user.id(), q, sort);
    }

    @GetMapping("/students/{id}")
    public TeacherStudentDetailResponse studentDetail(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return teacherHomeService.studentDetail(user.id(), id);
    }
}
