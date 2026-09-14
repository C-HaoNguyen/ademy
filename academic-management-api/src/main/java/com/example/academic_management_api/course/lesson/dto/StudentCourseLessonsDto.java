package com.example.academic_management_api.course.lesson.dto;

import java.util.List;

// Phase 35 — Lesson Player: payload tải lần đầu (topbar tên khóa học + progress bar tổng thể +
// sidebar danh sách lesson) trong 1 request duy nhất.
public class StudentCourseLessonsDto {
    private final Integer courseId;
    private final String courseTitle;
    private final List<StudentLessonDto> lessons;
    private final int progressPercent;
    // Cho frontend phân biệt "course thật sự chưa có lesson nào" (enrolled=true, lessons rỗng) với
    // "chưa mua nên chỉ thấy lesson preview, mà course không có lesson preview nào" (enrolled=false,
    // lessons rỗng) — 2 trường hợp cần thông báo khác nhau (UI_SPEC §3.3 Empty state vs Error state).
    private final boolean enrolled;

    public StudentCourseLessonsDto(Integer courseId, String courseTitle, List<StudentLessonDto> lessons, int progressPercent, boolean enrolled) {
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.lessons = lessons;
        this.progressPercent = progressPercent;
        this.enrolled = enrolled;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public List<StudentLessonDto> getLessons() {
        return lessons;
    }

    public int getProgressPercent() {
        return progressPercent;
    }

    public boolean isEnrolled() {
        return enrolled;
    }
}
