package com.example.academic_management_api.assessment.dto;

import com.example.academic_management_api.assessment.entity.QuizAttempts;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AttemptResultDto {
    private final Integer attemptId;
    private final Integer quizId;
    private final BigDecimal score;
    private final Integer correctCount;
    private final Integer totalQuestions;
    private final LocalDateTime submittedAt;

    public AttemptResultDto(QuizAttempts attempt) {
        this.attemptId = attempt.getId();
        this.quizId = attempt.getQuiz().getId();
        this.score = attempt.getScore();
        this.correctCount = attempt.getCorrectCount();
        this.totalQuestions = attempt.getTotalQuestions();
        this.submittedAt = attempt.getSubmittedAt();
    }

    public Integer getAttemptId() {
        return attemptId;
    }

    public Integer getQuizId() {
        return quizId;
    }

    public BigDecimal getScore() {
        return score;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }
}
