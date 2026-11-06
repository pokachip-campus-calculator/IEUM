package com.ieum.practice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * [역할] 연습 콘텐츠(질문지·시나리오·감정 읽기) 하나.
 * [동작] type별로 다른 내용은 content_json 문자열에 그대로 담고, 읽을 때 서비스가 JSON으로 푼다.
 * [연결] 홈·연습 목록(07·08), 연습 상세(09) / practices 테이블
 * [주의] JSON 컬럼은 문자열로 읽고 쓴다(형식이 type별로 달라서). 목록은 published=true만 보여 준다.
 */
@Entity
@Table(name = "practices")
public class Practice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PracticeType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PracticeArea area;

    @Column(nullable = false, length = 30)
    private String topic;

    @Column(nullable = false)
    private int level;

    @Column(nullable = false, length = 60)
    private String title;

    @Column(nullable = false, length = 200)
    private String summary;

    @Column(name = "est_minutes", nullable = false)
    private int estMinutes;

    @Column(name = "content_json", nullable = false, columnDefinition = "json")
    private String contentJson;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    protected Practice() {}

    public Long getId() { return id; }
    public PracticeType getType() { return type; }
    public PracticeArea getArea() { return area; }
    public String getTopic() { return topic; }
    public int getLevel() { return level; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public int getEstMinutes() { return estMinutes; }
    public String getContentJson() { return contentJson; }
    public int getSortOrder() { return sortOrder; }
    public boolean isPublished() { return published; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
