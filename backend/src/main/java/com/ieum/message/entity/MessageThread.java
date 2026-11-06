package com.ieum.message.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [역할] 학습자와 이음쌤 사이의 쪽지 묶음 하나.
 * [동작] 학습자·이음쌤·연결 시나리오를 id 숫자로만 가진다.
 * [연결] 쪽지 보내기·목록(12·13), 상세·이어쓰기(14·15), 이음쌤 쪽지(19~21) / message_threads 테이블
 * [주의] last_message_at은 목록 정렬 기준이라 메시지가 추가될 때마다 갱신한다.
 */
@Entity
@Table(name = "message_threads")
public class MessageThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ThreadTopic topic;

    @Column(name = "practice_id")
    private Long practiceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ThreadStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_message_at", nullable = false)
    private LocalDateTime lastMessageAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.lastMessageAt == null) this.lastMessageAt = this.createdAt;
    }

    protected MessageThread() {}

    public MessageThread(Long studentId, Long teacherId, ThreadTopic topic, Long practiceId) {
        this.studentId = studentId;
        this.teacherId = teacherId;
        this.topic = topic;
        this.practiceId = practiceId;
        this.status = ThreadStatus.WAITING;
    }

    public void touch(LocalDateTime at, ThreadStatus status) {
        this.lastMessageAt = at;
        this.status = status;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public Long getTeacherId() { return teacherId; }
    public ThreadTopic getTopic() { return topic; }
    public Long getPracticeId() { return practiceId; }
    public ThreadStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getLastMessageAt() { return lastMessageAt; }
}
