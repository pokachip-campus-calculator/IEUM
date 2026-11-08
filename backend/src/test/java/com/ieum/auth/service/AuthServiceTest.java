package com.ieum.auth.service;

import com.ieum.auth.dto.LoginRequest;
import com.ieum.auth.dto.LoginResponse;
import com.ieum.auth.dto.SignupRequest;
import com.ieum.auth.jwt.AuthUser;
import com.ieum.auth.jwt.JwtProvider;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.user.entity.GuardianRelation;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** [역할] 가입(01)·로그인(02)의 규칙(나이별 상태, 중복, 보호자, 비밀번호 암호화)을 DB 없이 확인한다. */
class AuthServiceTest {

    // 가입일을 2026-11-06으로 고정한다
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-06T03:00:00Z"), ZoneId.of("Asia/Seoul"));

    private UserRepository userRepository;
    private BCryptPasswordEncoder encoder;
    private AuthService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        encoder = new BCryptPasswordEncoder();
        JwtProvider jwt = new JwtProvider("test-secret-test-secret-test-secret-1234", 7);
        service = new AuthService(userRepository, encoder, jwt, CLOCK);
    }

    private SignupRequest student(LocalDate birth, SignupRequest.Guardian guardian) {
        return new SignupRequest(Role.STUDENT, "Student01", "password1", "홍길동", "길동", birth,
                "01012345678", null, "이음중", true, true, guardian);
    }

    private SignupRequest teacher() {
        return new SignupRequest(Role.TEACHER, "Teacher01", "password1", "김쌤", "김 이음쌤", null,
                null, null, null, true, true, null);
    }

    private User saved() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(captor.capture());
        return captor.getValue();
    }

    @Test
    void 이음쌤은_생년월일과_보호자_없이_ACTIVE로_저장된다() {
        var res = service.signup(teacher());

        assertThat(res.status()).isEqualTo(UserStatus.ACTIVE);
        User user = saved();
        assertThat(user.getBirthDate()).isNull();
        assertThat(user.getGuardianName()).isNull();
        assertThat(user.getRole()).isEqualTo(Role.TEACHER);
    }

    @Test
    void 만_14세_이상_학습자는_보호자를_무시하고_ACTIVE로_저장된다() {
        // 2012-11-06생 = 가입일 기준 만 14세
        var guardian = new SignupRequest.Guardian("엄마", GuardianRelation.PARENT, "01099999999");

        var res = service.signup(student(LocalDate.of(2012, 11, 6), guardian));

        assertThat(res.status()).isEqualTo(UserStatus.ACTIVE);
        assertThat(saved().getGuardianName()).isNull();
    }

    @Test
    void 만_14세_미만은_보호자가_있으면_PENDING_GUARDIAN으로_저장된다() {
        // 2012-11-07생 = 가입일 하루 전까지 만 13세
        var guardian = new SignupRequest.Guardian("엄마", GuardianRelation.PARENT, "01099999999");

        var res = service.signup(student(LocalDate.of(2012, 11, 7), guardian));

        assertThat(res.status()).isEqualTo(UserStatus.PENDING_GUARDIAN);
        User user = saved();
        assertThat(user.getGuardianName()).isEqualTo("엄마");
        assertThat(user.getGuardianRelation()).isEqualTo(GuardianRelation.PARENT);
    }

    @Test
    void 만_14세_미만인데_보호자가_없으면_입력_오류이고_저장하지_않는다() {
        assertThatThrownBy(() -> service.signup(student(LocalDate.of(2015, 1, 1), null)))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                    assertThat(e.getFieldErrors()).extracting("field").containsExactly("guardian");
                });
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void 학습자는_생년월일이_필수이다() {
        assertThatThrownBy(() -> service.signup(student(null, null)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getFieldErrors()).extracting("field").containsExactly("birthDate"));
    }

    @Test
    void 아이디는_소문자로_저장되고_비밀번호는_BCrypt로_저장된다() {
        service.signup(teacher());

        User user = saved();
        assertThat(user.getLoginId()).isEqualTo("teacher01");
        assertThat(user.getPasswordHash()).isNotEqualTo("password1");
        assertThat(encoder.matches("password1", user.getPasswordHash())).isTrue();
        assertThat(user.getTermsAgreedAt()).isEqualTo(LocalDateTime.of(2026, 11, 6, 12, 0));
    }

    @Test
    void 이미_있는_아이디는_LOGIN_ID_TAKEN() {
        when(userRepository.existsByLoginId("teacher01")).thenReturn(true);

        assertThatThrownBy(() -> service.signup(teacher()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.LOGIN_ID_TAKEN));
    }

    // ---- 로그인 ----

    private User account(UserStatus status) {
        User user = new User("student01", encoder.encode("password1"), Role.STUDENT, status,
                "홍길동", "길동", LocalDateTime.now(CLOCK));
        ReflectionTestUtils.setField(user, "id", 11L);
        when(userRepository.findByLoginId("student01")).thenReturn(Optional.of(user));
        return user;
    }

    @Test
    void 로그인하면_토큰과_사용자_요약을_주고_마지막_로그인이_갱신된다() {
        User user = account(UserStatus.ACTIVE);

        LoginResponse res = service.login(new LoginRequest("Student01", "password1"));

        assertThat(res.user().id()).isEqualTo(11L);
        assertThat(res.user().nickname()).isEqualTo("길동");
        assertThat(res.user().role()).isEqualTo(Role.STUDENT);
        assertThat(res.expiresAt().getOffset().getTotalSeconds()).isEqualTo(9 * 3600);
        assertThat(new JwtProvider("test-secret-test-secret-test-secret-1234", 7).parse(res.token()))
                .contains(new AuthUser(11L, Role.STUDENT));
        assertThat(user.getLastLoginAt()).isEqualTo(LocalDateTime.of(2026, 11, 6, 12, 0));
    }

    @Test
    void 비밀번호가_틀리면_BAD_CREDENTIALS() {
        account(UserStatus.ACTIVE);

        assertThatThrownBy(() -> service.login(new LoginRequest("student01", "wrong-password")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.BAD_CREDENTIALS));
    }

    @Test
    void 없는_아이디도_BAD_CREDENTIALS() {
        when(userRepository.findByLoginId(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequest("nobody", "password1")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.BAD_CREDENTIALS));
    }

    @Test
    void 보호자_확인_전이면_GUARDIAN_PENDING() {
        account(UserStatus.PENDING_GUARDIAN);

        assertThatThrownBy(() -> service.login(new LoginRequest("student01", "password1")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.GUARDIAN_PENDING));
    }
}
