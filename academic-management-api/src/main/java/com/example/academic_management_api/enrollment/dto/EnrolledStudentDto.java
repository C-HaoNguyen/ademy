package com.example.academic_management_api.enrollment.dto;

import java.time.LocalDateTime;

public class EnrolledStudentDto {
    private final Integer enrollmentId;
    private final String studentUsername;
    private final String studentFullName;
    private final LocalDateTime enrolledAt;

    public EnrolledStudentDto(Integer enrollmentId, String studentUsername, String studentFullName, LocalDateTime enrolledAt) {
        this.enrollmentId = enrollmentId;
        this.studentUsername = studentUsername;
        this.studentFullName = studentFullName;
        this.enrolledAt = enrolledAt;
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
}
