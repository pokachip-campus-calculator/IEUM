package com.ieum.signal.entity;

import jakarta.persistence.*;

/**
 * [역할] 신호 낱말 사전의 낱말 한 개.
 * [동작] 시드로만 채워지고 서버는 읽기만 한다.
 * [연결] 신호 검사(47) / signal_keywords 테이블
 * [주의] normalized는 소문자+한글·영문·숫자만 남긴 값이다. CHOSEONG은 active=0으로 보관된다.
 */
@Entity
@Table(name = "signal_keywords")
public class SignalKeyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 30)
    private String headword;

    @Column(nullable = false, length = 50)
    private String expression;

    @Column(nullable = false, length = 50)
    private String normalized;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false)
    private MatchType matchType;

    @Column(nullable = false)
    private boolean active;


    protected SignalKeyword() {}

    public Long getId() { return id; }
    public Severity getSeverity() { return severity; }
    public String getCategory() { return category; }
    public String getHeadword() { return headword; }
    public String getExpression() { return expression; }
    public String getNormalized() { return normalized; }
    public MatchType getMatchType() { return matchType; }
    public boolean isActive() { return active; }
}
