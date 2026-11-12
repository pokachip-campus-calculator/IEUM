package com.ieum.transfer.repository;

import com.ieum.transfer.entity.TransferRequest;
import com.ieum.transfer.entity.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

/** [역할] transfer_requests 테이블 조회·저장 통로. */
public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {

    // 신청할 때 "기다리는 신청 1건" 규칙을 확인한다
    boolean existsByStudentIdAndStatus(Long studentId, TransferStatus status);
}
