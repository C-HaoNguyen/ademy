package com.example.academic_management_api.assessment.dto;

import java.math.BigDecimal;

// Phase 28 — Dashboard/LearningProfile: tổng số bài test đã làm + điểm trung bình của Student
// hiện tại, gộp trên mọi khóa học (khác getMyAttempts() vốn chỉ trả lịch sử theo 1 quizId).
public class QuizAttemptSummaryDto {
    private final long attemptCount;
    private final BigDecimal averageScore;

    public QuizAttemptSummaryDto(long attemptCount, BigDecimal averageScore) {
        this.attemptCount = attemptCount;
        this.averageScore = averageScore;
    }

    public long getAttemptCount() {
        return attemptCount;
    }

    public BigDecimal getAverageScore() {
        return averageScore;
    }
}
