package com.ieum.user.service;

import com.ieum.auth.jwt.AccountChecker;
import com.ieum.common.ApiException;
import com.ieum.common.ErrorCode;
import com.ieum.user.dto.ChangePasswordRequest;
import com.ieum.user.dto.MeResponse;
import com.ieum.user.dto.UpdateMeRequest;
import com.ieum.user.entity.Role;
import com.ieum.user.entity.User;
import com.ieum.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * [역할] 내 정보 조회(03)·수정(04)·비밀번호 변경(05)·탈퇴(06)를 처리한다.
 * [동작] 토큰의 사용자 id로 본인 행만 읽고 바꾼다. 탈퇴는 users 행을 지우고 나머지는 DB 연쇄 삭제에 맡긴다.
 * [연결] MeController가 부른다 / UserRepository(users), PasswordEncoder
 * [주의] 현재 비밀번호가 틀려도 401이 아니라 VALIDATION_FAILED(currentPassword)다. 401이면 프런트가 로그아웃시키기 때문이다.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountChecker accountChecker;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AccountChecker accountChecker) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountChecker = accountChecker;
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        return toResponse(find(userId));
    }

    @Transactional
    public MeResponse updateMe(Long userId, UpdateMeRequest req) {
        User user = find(userId);
        if (req.nickname() != null) {
            user.changeNickname(req.nickname());
        }
        if (req.email() != null) {
            user.changeEmail(req.email().isEmpty() ? null : req.email());   // ""면 삭제
        }
        return toResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        User user = find(userId);
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw ApiException.invalid("currentPassword", "현재 비밀번호가 맞지 않습니다.");
        }
        user.changePasswordHash(passwordEncoder.encode(req.newPassword()));
    }

    @Transactional
    public void withdraw(Long userId) {
        User user = find(userId);
        if (user.getRole() != Role.STUDENT) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        userRepository.delete(user);
        accountChecker.forget(userId);   // 계정 확인 기억을 지워 탈퇴 직후 같은 토큰이 바로 401이 되게 한다
        // 학습 기록·쪽지·신호·알림은 DB의 ON DELETE CASCADE로 함께 지워진다
    }

    // 토큰은 맞는데 이미 탈퇴한 계정이면 로그인이 풀린 것으로 본다
    private User find(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
    }

    private MeResponse toResponse(User user) {
        MeResponse.TeacherSummary teacher = null;
        if (user.getRole() == Role.STUDENT && user.getTeacherId() != null) {
            teacher = userRepository.findById(user.getTeacherId())
                    .map(t -> new MeResponse.TeacherSummary(t.getId(), t.getNickname()))
                    .orElse(null);
        }
        return new MeResponse(user.getId(), user.getLoginId(), user.getNickname(), user.getEmail(), user.getRole(), teacher);
    }
}
