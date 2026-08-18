package com.example.academic_management_api.enrollment.dto;

import jakarta.validation.constraints.NotNull;

public class EnrollRequest {
    @NotNull(message = "Course id is required")
    private Integer courseId;

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }
}
