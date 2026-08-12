package com.example.academic_management_api.dto.course;

import com.example.academic_management_api.dto.CategoryDto;
import com.example.academic_management_api.dto.InstructorDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CourseResponseDto {

    public static final String DEFAULT_THUMBNAIL =
            "http://localhost:8080/images/default-course.png";

    private Integer courseId;
    private String title;
    private String description;
    private BigDecimal price;
    private String thumbnail;
    private LocalDateTime createdAt;

    private InstructorDto instructor;
    private CategoryDto category;

    public CourseResponseDto(Integer courseId, String title, String description, BigDecimal price, LocalDateTime createdAt, String thumbnail, String instructorUsername, String instructorFullName, Integer categoryId, String categoryName) {
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.price = price;
        this.thumbnail = thumbnail;

        this.instructor = new InstructorDto(instructorUsername, instructorFullName);
        this.category = new CategoryDto(categoryId, categoryName);
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getThumbnail() {
        return thumbnail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public InstructorDto getInstructor() {
        return instructor;
    }

    public CategoryDto getCategory() {
        return category;
    }
}
