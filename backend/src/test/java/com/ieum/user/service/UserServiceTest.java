package com.ieum.user.service;

import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.user.dto.ChangePasswordRequest;
import com.ieum.user.dto.MeResponse;
import com.ieum.user.dto.UpdateMeRequest;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** [역할] 내 정보 조회·수정·비밀번호 변경·탈퇴(03~06) 규칙을 DB 없이 확인한다. */
class UserServiceTest {

    private UserRepository userRepository;
    private BCryptPasswordEncoder encoder;
    private UserService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        encoder = new BCryptPasswordEncoder();
        service = new UserService(userRepository, encoder);
    }

    private User user(long id, Role role, String nickname) {
        User u = new User("user" + id, encoder.encode("password1"), role, UserStatus.ACTIVE, "이름", nickname, LocalDateTime.now());
        ReflectionTestUtils.setField(u, "id", id);
        when(userRepository.findById(id)).thenReturn(Optional.of(u));
        return u;
    }

    @Test
    void 이음쌤이_배정되지_않은_학습자의_teacher는_null() {
        user(1L, Role.STUDENT, "길동");

        MeResponse me = service.getMe(1L);

        assertThat(me.loginId()).isEqualTo("user1");
        assertThat(me.teacher()).isNull();
    }

    @Test
    void 배정된_이음쌤이_있으면_teacher에_id와_닉네임이_담긴다() {
        User student = user(1L, Role.STUDENT, "길동");
        user(2L, Role.TEACHER, "김 이음쌤");
        student.assignTeacher(2L, LocalDateTime.now());

        MeResponse me = service.getMe(1L);

        assertThat(me.teacher()).isEqualTo(new MeResponse.TeacherSummary(2L, "김 이음쌤"));
    }

    @Test
    void 이음쌤_본인의_teacher는_null() {
        user(2L, Role.TEACHER, "김 이음쌤");

        assertThat(service.getMe(2L).teacher()).isNull();
    }

    @Test
    void 수정은_보낸_필드만_바꾼다() {
        User u = user(1L, Role.STUDENT, "길동");
        u.changeEmail("old@ieum.kr");

        MeResponse me = service.updateMe(1L, new UpdateMeRequest("새닉네임", null));

        assertThat(me.nickname()).isEqualTo("새닉네임");
        assertThat(me.email()).isEqualTo("old@ieum.kr");
    }

    @Test
    void 이메일을_빈_문자열로_보내면_삭제된다() {
        User u = user(1L, Role.STUDENT, "길동");
        u.changeEmail("old@ieum.kr");

        MeResponse me = service.updateMe(1L, new UpdateMeRequest(null, ""));

        assertThat(me.email()).isNull();
        assertThat(me.nickname()).isEqualTo("길동");
    }

    @Test
    void 비밀번호를_바꾸면_새_비밀번호로_암호화되어_저장된다() {
        User u = user(1L, Role.STUDENT, "길동");

        service.changePassword(1L, new ChangePasswordRequest("password1", "newpassword2"));

        assertThat(encoder.matches("newpassword2", u.getPasswordHash())).isTrue();
        assertThat(encoder.matches("password1", u.getPasswordHash())).isFalse();
    }

    @Test
    void 현재_비밀번호가_틀리면_401이_아니라_VALIDATION_FAILED에_currentPassword() {
        User u = user(1L, Role.STUDENT, "길동");
        String before = u.getPasswordHash();

        assertThatThrownBy(() -> service.changePassword(1L, new ChangePasswordRequest("wrong", "newpassword2")))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                    assertThat(e.getFieldErrors()).extracting("field").containsExactly("currentPassword");
                });
        assertThat(u.getPasswordHash()).isEqualTo(before);
    }

    @Test
    void 학습자는_탈퇴할_수_있다() {
        User u = user(1L, Role.STUDENT, "길동");

        service.withdraw(1L);

        verify(userRepository).delete(u);
    }

    @Test
    void 이음쌤이_탈퇴를_부르면_FORBIDDEN이고_지우지_않는다() {
        user(2L, Role.TEACHER, "김 이음쌤");

        assertThatThrownBy(() -> service.withdraw(2L))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
        verify(userRepository, never()).delete(any());
    }

    @Test
    void 이미_탈퇴한_계정의_토큰이면_UNAUTHORIZED() {
        when(userRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getMe(9L))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }
}
