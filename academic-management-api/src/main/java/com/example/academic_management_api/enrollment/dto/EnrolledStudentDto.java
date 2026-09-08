package com.example.academic_management_api.enrollment.dto;

import java.time.LocalDateTime;

public class EnrolledStudentDto {
    private final Integer enrollmentId;
    private final String studentUsername;
    private final String studentFullName;
    private final LocalDateTime enrolledAt;
    // Phase 31 — AdminCourses "Thu hồi quyền truy cập": cho biết học viên đã bị thu hồi hay chưa
    // (null nếu còn quyền truy cập) để frontend disable lại action tương ứng.
    private final LocalDateTime accessRevokedAt;

    public EnrolledStudentDto(
            Integer enrollmentId,
            String studentUsername,
            String studentFullName,
            LocalDateTime enrolledAt,
            LocalDateTime accessRevokedAt
    ) {
        this.enrollmentId = enrollmentId;
        this.studentUsername = studentUsername;
        this.studentFullName = studentFullName;
        this.enrolledAt = enrolledAt;
        this.accessRevokedAt = accessRevokedAt;
    }

    public Integer getEnrollmentId() {
        return enrollmentId;
    }

    public String getStudentUsername() {
        return studentUsername;
    }

    public String getStudentFullName() {
        return studentFullName;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public LocalDateTime getAccessRevokedAt() {
        return accessRevokedAt;
    }
}
