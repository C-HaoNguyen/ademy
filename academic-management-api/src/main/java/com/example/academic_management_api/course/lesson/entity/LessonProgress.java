package com.example.academic_management_api.course.lesson.entity;

import com.example.academic_management_api.user.entity.Users;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "lesson_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "lesson_id"})
)
public class LessonProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Integer progressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Users student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lessons lesson;

    private Boolean completed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public Integer getProgressId() {
        return progressId;
    }

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
