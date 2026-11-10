package com.ieum.user.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** [역할] 신호 대응 기록(21) 요청 본문. handled는 필수이고, memo는 500자 이하이며 생략하면 기존 메모를 그대로 둔다. */
public record HandleSignalRequest(
        @NotNull(message = "처리 여부를 보내 주세요.")
        Boolean handled,
        @Size(max = 500, message = "500자 이하로 적어 주세요.")
        String memo
) {
}
