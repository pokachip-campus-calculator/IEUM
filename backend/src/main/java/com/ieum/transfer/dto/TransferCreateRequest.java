package com.ieum.transfer.dto;

import jakarta.validation.constraints.NotBlank;

/** [역할] 25 요청 본문. 받는 이음쌤을 아이디로 지정한다. */
public record TransferCreateRequest(@NotBlank String toLoginId) {}
