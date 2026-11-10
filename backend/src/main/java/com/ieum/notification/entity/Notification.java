package com.ieum.notification.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [역할] 앱 안 알림 한 건(받는 사람별 새 소식과 읽음 상태).
 * [동작] 받는 사람, 종류, 서버가 정한 문구, 이동할 곳, 읽음 여부를 가진다.
 * [연결] 알림 API와 알림 생성(22~24) / notifications 테이블
 * [주의] 제목·내용은 서버가 정한 문구만 쓴다. 쪽지 본문과 찾은 낱말은 넣지 않는다.
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(nullable = false, length = 200)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type")
    private LinkType linkType;

    @Column(name = "link_id")
    private Long linkId;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS); }

    protected Notification() {}

    public Notification(Long userId, NotificationType type, String title, String body, LinkType linkType, Long linkId) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.body = body;
        this.linkType = linkType;
        this.linkId = linkId;
    }

    public void markRead(LocalDateTime at) {
        this.read = true;
        this.readAt = at;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public NotificationType getType() { return type; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public LinkType getLinkType() { return linkType; }
    public Long getLinkId() { return linkId; }
    public boolean isRead() { return read; }
    public LocalDateTime getReadAt() { return readAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
