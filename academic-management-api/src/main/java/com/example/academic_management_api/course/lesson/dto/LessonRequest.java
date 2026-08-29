package com.example.academic_management_api.course.lesson.dto;

import com.example.academic_management_api.course.lesson.entity.LessonContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LessonRequest {
    @NotBlank
    private String title;

    private String content;

    @NotNull
    private Integer orderIndex;

    private Integer duration;

    private Boolean isPreview;

    @NotNull
    private LessonContentType contentType;

    private String videoUrl;

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public Integer getDuration() {
        return duration;
    }

    public Boolean getIsPreview() {
        return isPreview;
    }

    public LessonContentType getContentType() {
        return contentType;
    }

    public String getVideoUrl() {
        return videoUrl;
    }
}
