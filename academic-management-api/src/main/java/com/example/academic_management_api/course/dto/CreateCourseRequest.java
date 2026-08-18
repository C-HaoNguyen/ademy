package com.example.academic_management_api.course.dto;

import com.example.academic_management_api.course.entity.CourseLevel;
import com.example.academic_management_api.course.entity.CourseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CreateCourseRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Integer instructorId;

    private Integer categoryId;

    private String thumbnail;

    @NotNull
    private BigDecimal price;

    private CourseLevel level;

    private CourseStatus status;

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Integer getInstructorId() {
        return instructorId;
    }

    public Integer getCategoryId() {
        return categoryId;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public CourseLevel getLevel() {
        return level;
    }

    public CourseStatus getStatus() {
        return status;
    }
}
