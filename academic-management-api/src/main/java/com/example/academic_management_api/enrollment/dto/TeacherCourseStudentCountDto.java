package com.example.academic_management_api.enrollment.dto;

public class TeacherCourseStudentCountDto {
    private final Integer courseId;
    private final Long studentCount;

    public TeacherCourseStudentCountDto(Integer courseId, Long studentCount) {
        this.courseId = courseId;
        this.studentCount = studentCount;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public Long getStudentCount() {
        return studentCount;
    }
}
