package com.ieum.user.dto;

import com.ieum.user.entity.Role;

/** [역할] 내 정보(03·04) 응답. 이음쌤이 배정되지 않았거나 본인이 이음쌤이면 teacher는 null이다. */
public record MeResponse(Long id, String loginId, String nickname, String email, Role role, TeacherSummary teacher) {

    /** [역할] 내 담당 이음쌤 요약(id·닉네임). */
    public record TeacherSummary(Long id, String nickname) {}
}
