package com.example.academic_management_api.course.lesson.dto;

// Chỉ dùng nội bộ LessonService (kết quả group-by của LessonProgressRepository) — không phải
// response DTO của controller nào.
public class StudentLessonCompletionCountDto {
    private final Integer studentId;
    private final long completedCount;

    public StudentLessonCompletionCountDto(Integer studentId, long completedCount) {
        this.studentId = studentId;
        this.completedCount = completedCount;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public long getCompletedCount() {
        return completedCount;
    }
}
