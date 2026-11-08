package com.ieum.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** [역할] 비밀번호 변경(05) 요청: 현재 비밀번호와 새 비밀번호. */
public record ChangePasswordRequest(
        @NotBlank(message = "현재 비밀번호를 입력해 주세요.")
        String currentPassword,

        @NotBlank(message = "새 비밀번호를 입력해 주세요.")
        @Size(min = 8, max = 72, message = "새 비밀번호는 8자 이상 입력해 주세요.")
        String newPassword
) {
}
