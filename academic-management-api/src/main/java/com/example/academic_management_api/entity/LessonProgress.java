package com.example.academic_management_api.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@IdClass(LessonProgressId.class)
@Entity
@Table(name = "lesson_progress")
public class LessonProgress {
    @Id
    @ManyToOne
    @JoinColumn(name = "student_id")
    private Users student;

    @Id
    @ManyToOne
    @JoinColumn(name = "lesson_id")
    private Lessons lesson;

    private Boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public Users getStudent() {
        return student;
    }

    public Lessons getLesson() {
        return lesson;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
