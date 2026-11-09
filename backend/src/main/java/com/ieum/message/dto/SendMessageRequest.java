package com.ieum.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** [역할] 이어쓰기·답장(15) 요청 본문. 1~500자이고 공백뿐이면 안 된다. */
public record SendMessageRequest(
        @NotBlank(message = "쪽지 내용을 입력해 주세요.")
        @Size(max = 500, message = "쪽지는 500자 이하로 입력해 주세요.")
        String body
) {
}
