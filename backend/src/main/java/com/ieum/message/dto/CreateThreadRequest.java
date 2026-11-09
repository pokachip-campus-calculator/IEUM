package com.ieum.message.dto;

import com.ieum.message.entity.ThreadTopic;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** [역할] 쪽지 보내기(12) 요청 본문. practiceId는 S08 시나리오에서 넘어온 경우에만 온다. */
public record CreateThreadRequest(
        @NotNull(message = "쪽지 주제를 선택해 주세요.")
        ThreadTopic topic,

        @NotBlank(message = "쪽지 내용을 입력해 주세요.")
        @Size(max = 500, message = "쪽지는 500자 이하로 입력해 주세요.")
        String body,

        Long practiceId
) {
}
