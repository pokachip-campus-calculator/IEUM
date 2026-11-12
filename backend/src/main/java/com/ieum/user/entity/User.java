package com.ieum.user.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * [역할] 계정(학습자·이음쌤 공통) 한 명.
 * [동작] DB 행과 1:1로 대응하고, 담당 이음쌤은 teacher_id 숫자로만 가진다.
 * [연결] 회원가입·로그인(01·02), 내 정보(03~06), 쪽지 자동 배정(12)이 쓴다 / users 테이블
 * [주의] login_id는 대소문자 구분 없이 유일해야 해서 가입 때 소문자로 맞춰 저장한다. 비밀번호는 BCrypt 해시만 넣는다.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", nullable = false, length = 20)
    private String loginId;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 20)
    private String nickname;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 11)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(length = 50)
    private String school;

    @Column(name = "guardian_name", length = 30)
    private String guardianName;

    @Enumerated(EnumType.STRING)
    @Column(name = "guardian_relation")
    private GuardianRelation guardianRelation;

    @Column(name = "guardian_contact", length = 100)
    private String guardianContact;

    @Column(name = "teacher_id")
    private Long teacherId;

    @Column(name = "teacher_assigned_at")
    private LocalDateTime teacherAssignedAt;

    @Column(name = "terms_agreed_at", nullable = false)
    private LocalDateTime termsAgreedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS); }

    protected User() {}

    public User(String loginId, String passwordHash, Role role, UserStatus status, String name, String nickname,
                LocalDateTime termsAgreedAt) {
        this.loginId = loginId;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = status;
        this.name = name;
        this.nickname = nickname;
        this.termsAgreedAt = termsAgreedAt;
    }

    public void setProfile(LocalDate birthDate, String phone, String email, String school) {
        this.birthDate = birthDate;
        this.phone = phone;
        this.email = email;
        this.school = school;
    }

    public void setGuardian(String name, GuardianRelation relation, String contact) {
        this.guardianName = name;
        this.guardianRelation = relation;
        this.guardianContact = contact;
    }

    public void assignTeacher(Long teacherId, LocalDateTime at) {
        this.teacherId = teacherId;
        this.teacherAssignedAt = at;
    }

    public void changeNickname(String nickname) { this.nickname = nickname; }
    public void changeEmail(String email) { this.email = email; }
    public void changePasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public void markLogin(LocalDateTime at) { this.lastLoginAt = at; }

    public Long getId() { return id; }
    public String getLoginId() { return loginId; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public UserStatus getStatus() { return status; }
    public String getName() { return name; }
    public String getNickname() { return nickname; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getSchool() { return school; }
    public String getGuardianName() { return guardianName; }
    public GuardianRelation getGuardianRelation() { return guardianRelation; }
    public String getGuardianContact() { return guardianContact; }
    public Long getTeacherId() { return teacherId; }
    public LocalDateTime getTeacherAssignedAt() { return teacherAssignedAt; }
    public LocalDateTime getTermsAgreedAt() { return termsAgreedAt; }
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
