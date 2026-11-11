package com.ieum.message.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [역할] 쪽지 묶음 안의 메시지 한 건.
 * [동작] 보낸 사람 역할과 본문, 받는 사람이 읽은 시각을 가진다.
 * [연결] 쪽지 보내기·이어쓰기(12·15), 알림 생성(22~24), 신호 검사(47) / messages 테이블
 * [주의] 본문은 알림 문구나 신호 기록에 복사하지 않는다.
 */
@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thread_id", nullable = false)
    private Long threadId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false)
    private SenderRole senderRole;

    @Column(nullable = false, length = 500)
    private String body;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS); }

    protected Message() {}

    public Message(Long threadId, SenderRole senderRole, String body) {
        this.threadId = threadId;
        this.senderRole = senderRole;
        this.body = body;
    }

    public void markRead(LocalDateTime at) { this.readAt = at; }

    public Long getId() { return id; }
    public Long getThreadId() { return threadId; }
    public SenderRole getSenderRole() { return senderRole; }
    public String getBody() { return body; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getReadAt() { return readAt; }
}
