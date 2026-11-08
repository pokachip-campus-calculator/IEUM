package com.ieum.auth.dto;

import com.ieum.user.entity.GuardianRelation;
import com.ieum.user.entity.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** [역할] 회원가입(01) 요청 본문. 형식 검사는 여기서, 역할·나이에 따른 검사는 AuthService에서 한다. */
public record SignupRequest(
        @NotNull(message = "가입 유형을 선택해 주세요.")
        Role role,

        @Pattern(regexp = "^[A-Za-z0-9]{4,20}$", message = "아이디는 영문·숫자 4~20자로 입력해 주세요.")
        String loginId,

        @NotBlank(message = "비밀번호를 입력해 주세요.")
        @Size(min = 8, max = 72, message = "비밀번호는 8자 이상 입력해 주세요.")
        String password,

        @NotBlank(message = "이름을 입력해 주세요.")
        @Size(max = 30, message = "이름은 30자 이하로 입력해 주세요.")
        String name,

        @NotBlank(message = "닉네임을 입력해 주세요.")
        @Size(min = 1, max = 20, message = "닉네임은 1~20자로 입력해 주세요.")
        String nickname,

        @Past(message = "생년월일이 올바르지 않습니다.")
        LocalDate birthDate,

        @Pattern(regexp = "^[0-9]{10,11}$", message = "전화번호는 숫자 10~11자리로 입력해 주세요.")
        String phone,

        @Email(message = "이메일 형식이 올바르지 않습니다.")
        @Size(max = 100, message = "이메일은 100자 이하로 입력해 주세요.")
        String email,

        @Size(max = 50, message = "학교는 50자 이하로 입력해 주세요.")
        String school,

        @AssertTrue(message = "이용약관에 동의해 주세요.")
        boolean agreeTerms,

        @AssertTrue(message = "개인정보 수집·이용에 동의해 주세요.")
        boolean agreePrivacy,

        @Valid
        Guardian guardian
) {
    /** [역할] 만 14세 미만 학습자의 보호자 정보. */
    public record Guardian(
            @Size(max = 30, message = "보호자 이름은 30자 이하로 입력해 주세요.")
            String name,
            GuardianRelation relation,
            @Size(max = 100, message = "보호자 연락처는 100자 이하로 입력해 주세요.")
            String contact
    ) {}
}
