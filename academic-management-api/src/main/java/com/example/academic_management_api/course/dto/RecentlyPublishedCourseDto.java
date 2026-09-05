package com.example.academic_management_api.course.dto;

import java.time.LocalDateTime;

// Phase 29 — AdminDashboard "Khóa học mới publish gần đây". DTO phẳng thay vì trả raw Courses
// (tránh leak lazy proxy Courses.instructor khi serialize — cùng lý do MyCourseDto, Phase 28).
public class RecentlyPublishedCourseDto {
    private final Integer courseId;
    private final String title;
    private final String thumbnail;
    private final String instructorName;
    private final LocalDateTime updatedAt;

    public RecentlyPublishedCourseDto(
            Integer courseId, String title, String thumbnail, String instructorName, LocalDateTime updatedAt) {
        this.courseId = courseId;
        this.title = title;
        this.thumbnail = thumbnail;
        this.instructorName = instructorName;
        this.updatedAt = updatedAt;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
