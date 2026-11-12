package com.ieum.user.dto;

import jakarta.validation.constraints.AssertTrue;

/** [역할] 탈퇴(06) 요청. 화면의 "기록이 바로 지워지는 것을 알고 있어요" 체크 값이며, true가 아니면 VALIDATION_FAILED(acknowledged)다. */
public record WithdrawRequest(
        @AssertTrue(message = "기록이 바로 지워지는 것을 확인해 주세요.")
        boolean acknowledged
) {}
