package com.example.academic_management_api.enrollment.entity;

import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.user.entity.Users;
import jakarta.persistence.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;

// Uniqueness của (student_id, course_id) chỉ áp dụng cho enrollment còn active
// (access_revoked_at is null) — enforced bằng partial unique index ở migration V5,
// không thể khai báo bằng @UniqueConstraint (không hỗ trợ WHERE clause).
@Entity
@Table(name = "enrollments")
public class Enrollments {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "enrollment_id")
    private Integer enrollmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Users student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Courses course;

    @Column(name = "enrolled_at", updatable = false)
    private LocalDateTime enrolledAt;

    @Column(name = "access_revoked_at")
    private LocalDateTime accessRevokedAt;

    @Column(name = "access_revoked_reason", columnDefinition = "text")
    private String accessRevokedReason;

    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
    }

    public Users getStudent() {
        return student;
    }

    public Courses getCourse() {
        return course;
    }

    public Integer getEnrollmentId() {
        return enrollmentId;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrollmentId(Integer enrollmentId) {
        this.enrollmentId = enrollmentId;
    }

    public void setStudent(Users student) {
        this.student = student;
    }

    public void setCourse(Courses course) {
        this.course = course;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    public LocalDateTime getAccessRevokedAt() {
        return accessRevokedAt;
    }

    public void setAccessRevokedAt(LocalDateTime accessRevokedAt) {
        this.accessRevokedAt = accessRevokedAt;
    }

    public String getAccessRevokedReason() {
        return accessRevokedReason;
    }

    public void setAccessRevokedReason(String accessRevokedReason) {
        this.accessRevokedReason = accessRevokedReason;
    }
}
