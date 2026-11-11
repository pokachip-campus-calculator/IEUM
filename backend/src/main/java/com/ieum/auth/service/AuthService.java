package com.ieum.auth.service;

import com.ieum.auth.dto.LoginRequest;
import com.ieum.auth.dto.LoginResponse;
import com.ieum.auth.dto.SignupRequest;
import com.ieum.auth.dto.SignupResponse;
import com.ieum.auth.jwt.JwtProvider;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.entity.UserStatus;
import com.ieum.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.Period;

/**
 * [역할] 회원가입(01)과 로그인(02)의 규칙을 처리한다.
 * [동작] 가입은 역할·나이에 따라 ACTIVE/PENDING_GUARDIAN을 정해 저장하고, 로그인은 비밀번호·상태를 확인해 토큰을 준다.
 * [연결] AuthController가 부른다 / UserRepository(users), JwtProvider, PasswordEncoder, Clock
 * [주의] 로그인 아이디는 소문자로 바꿔 저장·조회한다(대소문자 구분 없이 중복 불가). 만 14세 기준은 가입일이다.
 */
@Service
public class AuthService {

    private static final int GUARDIAN_REQUIRED_UNDER_AGE = 14;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final Clock clock;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtProvider jwtProvider, Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.clock = clock;
    }

    @Transactional
    public SignupResponse signup(SignupRequest req) {
        LocalDateTime now = LocalDateTime.now(clock);
        String loginId = req.loginId().toLowerCase();

        // 이음쌤은 가입으로 만들지 않는다(기관 확인 후 DB에 직접 넣는다)
        if (req.role() == Role.TEACHER) {
            throw new ApiException(ErrorCode.TEACHER_SIGNUP_CLOSED);
        }

        // 생년월일은 학습자 필수
        if (req.birthDate() == null) {
            throw ApiException.invalid("birthDate", "생년월일을 입력해 주세요.");
        }

        UserStatus status = UserStatus.ACTIVE;
        boolean needGuardian = false;
        // 보호자 확인은 학습자만 해당한다
        if (req.role() == Role.STUDENT) {
            needGuardian = isUnderGuardianAge(req.birthDate(), now.toLocalDate());
            if (needGuardian) {
                requireGuardian(req.guardian());
                status = UserStatus.PENDING_GUARDIAN;
            }
        }

        if (userRepository.existsByLoginId(loginId)) {
            throw new ApiException(ErrorCode.LOGIN_ID_TAKEN);
        }

        User user = new User(loginId, passwordEncoder.encode(req.password()), req.role(), status,
                req.name(), req.nickname(), now);
        user.setProfile(req.birthDate(), req.phone(), req.email(), req.school());
        if (needGuardian) {
            user.setGuardian(req.guardian().name(), req.guardian().relation(), req.guardian().contact());
        }

        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // 동시에 같은 아이디로 가입한 경우(유니크 키 충돌)
            throw new ApiException(ErrorCode.LOGIN_ID_TAKEN);
        }
        return new SignupResponse(status);
    }

    @Transactional
    public LoginResponse login(LoginRequest req) {
        // 아이디가 없든 비밀번호가 틀리든 같은 오류로 답한다(계정 존재 여부를 알려주지 않기 위해)
        User user = userRepository.findByLoginId(req.loginId().toLowerCase())
                .orElseThrow(() -> new ApiException(ErrorCode.BAD_CREDENTIALS));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(ErrorCode.BAD_CREDENTIALS);
        }
        if (user.getStatus() == UserStatus.PENDING_GUARDIAN) {
            throw new ApiException(ErrorCode.GUARDIAN_PENDING);
        }

        user.markLogin(LocalDateTime.now(clock));
        String token = jwtProvider.issue(user.getId(), user.getRole());
        OffsetDateTime expiresAt = jwtProvider.expiresAt(token).toInstant().atZone(clock.getZone()).toOffsetDateTime();
        return new LoginResponse(token, expiresAt,
                new LoginResponse.UserSummary(user.getId(), user.getNickname(), user.getRole()));
    }

    // 가입일 기준 만 14세 미만이면 보호자 확인이 필요하다
    private boolean isUnderGuardianAge(LocalDate birthDate, LocalDate today) {
        return Period.between(birthDate, today).getYears() < GUARDIAN_REQUIRED_UNDER_AGE;
    }

    private void requireGuardian(SignupRequest.Guardian g) {
        if (g == null || isBlank(g.name()) || g.relation() == null || isBlank(g.contact())) {
            throw ApiException.invalid("guardian", "만 14세 미만은 보호자 정보를 모두 입력해 주세요.");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
