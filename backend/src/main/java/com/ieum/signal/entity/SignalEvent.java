package com.ieum.signal.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [역할] 학습자 메시지에서 신호 낱말이 발견된 기록 한 건.
 * [동작] 메시지 1건당 최대 1행이고, 이음쌤의 대응 메모와 처리 시각을 가진다.
 * [연결] 신호 검사(47), 이음쌤 신호 API(19~21) / signal_events 테이블
 * [주의] response_memo는 학습자에게 보이면 안 된다.
 */
@Entity
@Table(name = "signal_events")
public class SignalEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "message_id", nullable = false)
    private Long messageId;

    @Column(name = "keyword_id", nullable = false)
    private Long keywordId;

    @Column(name = "matched_text", nullable = false, length = 50)
    private String matchedText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SignalStatus status;

    @Column(name = "response_memo", length = 500)
    private String responseMemo;

    @Column(name = "handled_at")
    private LocalDateTime handledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    protected SignalEvent() {}

    public SignalEvent(Long studentId, Long messageId, Long keywordId, String matchedText) {
        this.studentId = studentId;
        this.messageId = messageId;
        this.keywordId = keywordId;
        this.matchedText = matchedText;
        this.status = SignalStatus.OPEN;
    }

    public void handle(String memo, LocalDateTime at) {
        this.status = SignalStatus.HANDLED;
        this.responseMemo = memo;
        this.handledAt = at;
    }

    // 21번: handled=true면 HANDLED+처리 시각, false면 OPEN+시각 null. memo가 null이면 기존 메모를 그대로 둔다
    // 이미 처리된 신호에 handled=true를 또 보내면 가장 처음 처리한 시각을 유지한다
    public void updateHandling(boolean handled, String memo, LocalDateTime at) {
        boolean alreadyHandled = this.status == SignalStatus.HANDLED && this.handledAt != null;
        this.status = handled ? SignalStatus.HANDLED : SignalStatus.OPEN;
        this.handledAt = handled ? (alreadyHandled ? this.handledAt : at) : null;
        if (memo != null) {
            this.responseMemo = memo;
        }
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public Long getMessageId() { return messageId; }
    public Long getKeywordId() { return keywordId; }
    public String getMatchedText() { return matchedText; }
    public SignalStatus getStatus() { return status; }
    public String getResponseMemo() { return responseMemo; }
    public LocalDateTime getHandledAt() { return handledAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
