package com.ieum.transfer.dto;

import com.ieum.transfer.entity.TransferStatus;

import java.time.OffsetDateTime;

/** [역할] 25 응답. 만들어진 신청의 번호·상태·신청 시각. */
public record TransferCreateResponse(Long id, TransferStatus status, OffsetDateTime createdAt) {}
