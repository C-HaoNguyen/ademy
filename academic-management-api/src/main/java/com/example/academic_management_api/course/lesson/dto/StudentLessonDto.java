package com.example.academic_management_api.course.lesson.dto;

import com.example.academic_management_api.course.lesson.entity.LessonContentType;
import com.example.academic_management_api.course.lesson.entity.Lessons;

// Phase 35 — Lesson Player: dùng chung cho cả list item (sidebar) lẫn nội dung đầy đủ 1 lesson
// (content area) — khác LessonPreviewDto (public, chỉ lesson isPreview=true, không có completed).
public class StudentLessonDto {
    private final Integer lessonId;
    private final String title;
    private final String content;
    private final LessonContentType contentType;
    private final String videoUrl;
    private final Integer duration;
    private final Integer orderIndex;
    private final boolean isPreview;
    private final boolean completed;

    public StudentLessonDto(Lessons lesson, boolean completed) {
        this.lessonId = lesson.getLessonId();
        this.title = lesson.getTitle();
        this.content = lesson.getContent();
        this.contentType = lesson.getContentType();
        this.videoUrl = lesson.getVideoUrl();
        this.duration = lesson.getDuration();
        this.orderIndex = lesson.getOrderIndex();
        this.isPreview = Boolean.TRUE.equals(lesson.getPreview());
        this.completed = completed;
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

    public boolean isPreview() {
        return isPreview;
    }

    public boolean isCompleted() {
        return completed;
    }
}
