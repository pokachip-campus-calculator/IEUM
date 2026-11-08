package com.ieum.record.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [역할] 학습자 한 명의 연습 하나에 대한 진행·완료 기록.
 * [동작] 학습자×연습당 1행이고, 답은 answers_json 문자열로 저장한다.
 * [연결] 연습 진행 저장(10), 내 학습 기록(11) / practice_records 테이블
 * [주의] my_note("나에게 한 줄")는 이음쌤 API가 읽지 않는다. JSON 컬럼은 문자열로 읽고 쓴다.
 */
@Entity
@Table(name = "practice_records")
public class PracticeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "practice_id", nullable = false)
    private Long practiceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecordStatus status;

    @Column(name = "answers_json", nullable = false, columnDefinition = "json")
    private String answersJson;

    @Column(name = "my_note", length = 500)
    private String myNote;

    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() {
        this.startedAt = LocalDateTime.now();
        this.updatedAt = this.startedAt;
    }

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    protected PracticeRecord() {}

    public PracticeRecord(Long userId, Long practiceId, String answersJson) {
        this.userId = userId;
        this.practiceId = practiceId;
        this.status = RecordStatus.IN_PROGRESS;
        this.answersJson = answersJson;
    }

    public void saveProgress(String answersJson, String myNote) {
        this.answersJson = answersJson;
        this.myNote = myNote;
    }

    public void complete(LocalDateTime at) {
        this.status = RecordStatus.DONE;
        this.completedAt = at;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getPracticeId() { return practiceId; }
    public RecordStatus getStatus() { return status; }
    public String getAnswersJson() { return answersJson; }
    public String getMyNote() { return myNote; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
}
