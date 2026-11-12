package com.ieum.transfer.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [역할] 이음쌤 A가 자기 학습자를 이음쌤 B에게 넘기자고 한 신청 한 건.
 * [동작] 신청하면 PENDING, 받는 이음쌤이 수락하면 ACCEPTED와 수락 시각이 기록된다.
 * [연결] TransferService(25·26) / transfer_requests 테이블(V6)
 */
@Entity
@Table(name = "transfer_requests")
public class TransferRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "from_teacher_id", nullable = false)
    private Long fromTeacherId;

    @Column(name = "to_teacher_id", nullable = false)
    private Long toTeacherId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferStatus status = TransferStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS); }

    protected TransferRequest() {}

    public TransferRequest(Long studentId, Long fromTeacherId, Long toTeacherId) {
        this.studentId = studentId;
        this.fromTeacherId = fromTeacherId;
        this.toTeacherId = toTeacherId;
    }

    public void accept(LocalDateTime at) {
        this.status = TransferStatus.ACCEPTED;
        this.handledAt = at;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public Long getFromTeacherId() { return fromTeacherId; }
    public Long getToTeacherId() { return toTeacherId; }
    public TransferStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getHandledAt() { return handledAt; }
}
