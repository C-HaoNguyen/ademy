package com.example.academic_management_api.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "lessons")
public class Lessons {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lesson_id")
    private Integer lessonId;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Courses course;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    private Integer duration; // phút

    @Column(name = "is_preview")
    private Boolean isPreview = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Integer getLessonId() {
        return lessonId;
    }

    public Courses getCourse() {
        return course;
    }

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

    public Boolean getPreview() {
        return isPreview;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
