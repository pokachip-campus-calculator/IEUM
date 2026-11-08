package com.ieum.user.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** [역할] 내 정보 수정(04) 요청. 보내지 않은(null) 필드는 바꾸지 않고, email을 ""로 보내면 삭제한다. */
public record UpdateMeRequest(
        @Pattern(regexp = ".*\\S.*", message = "닉네임은 공백만 쓸 수 없습니다.")
        @Size(min = 1, max = 20, message = "닉네임은 1~20자로 입력해 주세요.")
        String nickname,

        @Pattern(regexp = "^$|^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "이메일 형식이 올바르지 않습니다.")
        @Size(max = 100, message = "이메일은 100자 이하로 입력해 주세요.")
        String email
) {
}
