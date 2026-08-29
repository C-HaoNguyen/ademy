package com.example.academic_management_api.course.lesson.dto;

import com.example.academic_management_api.course.lesson.entity.LessonContentType;
import com.example.academic_management_api.course.lesson.entity.Lessons;

public class LessonPreviewDto {
    private final Integer lessonId;
    private final String title;
    private final String content;
    private final LessonContentType contentType;
    private final String videoUrl;
    private final Integer duration;
    private final Integer orderIndex;

    public LessonPreviewDto(Lessons lesson) {
        this.lessonId = lesson.getLessonId();
        this.title = lesson.getTitle();
        this.content = lesson.getContent();
        this.contentType = lesson.getContentType();
        this.videoUrl = lesson.getVideoUrl();
        this.duration = lesson.getDuration();
        this.orderIndex = lesson.getOrderIndex();
    }

    public Integer getLessonId() {
        return lessonId;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public LessonContentType getContentType() {
        return contentType;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public Integer getDuration() {
        return duration;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }
}
