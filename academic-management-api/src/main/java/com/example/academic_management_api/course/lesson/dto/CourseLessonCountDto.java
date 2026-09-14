package com.example.academic_management_api.course.lesson.dto;

// Chỉ dùng nội bộ LessonService (kết quả group-by theo courseId) — không phải response DTO của
// controller nào. Dùng chung shape (courseId, count) cho cả "tổng số lesson" và "số lesson đã hoàn
// thành" của 1 course — 2 ngữ cảnh gọi khác nhau nhưng cùng shape dữ liệu.
public class CourseLessonCountDto {
    private final Integer courseId;
    private final long count;

    public CourseLessonCountDto(Integer courseId, long count) {
        this.courseId = courseId;
        this.count = count;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public long getCount() {
        return count;
    }
}
