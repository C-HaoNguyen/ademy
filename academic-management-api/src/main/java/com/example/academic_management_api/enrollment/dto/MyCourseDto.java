package com.example.academic_management_api.enrollment.dto;

import java.time.LocalDateTime;

// Thay cho việc trả raw List<Courses> (leak lazy proxy Courses.instructor khi serialize) —
// Phase 28: MyCourses/Dashboard cần instructorName + enrolledAt mà entity Courses không tự có.
public class MyCourseDto {
    private final Integer courseId;
    private final String title;
    private final String thumbnail;
    private final String instructorName;
    private final LocalDateTime enrolledAt;

    public MyCourseDto(Integer courseId, String title, String thumbnail, String instructorName, LocalDateTime enrolledAt) {
        this.courseId = courseId;
        this.title = title;
        this.thumbnail = thumbnail;
        this.instructorName = instructorName;
        this.enrolledAt = enrolledAt;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getTitle() {
        return title;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public String getInstructorName() {
        return instructorName;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }
}
