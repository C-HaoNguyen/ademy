package com.example.academic_management_api.assessment.dto;

import java.math.BigDecimal;

public class CourseTestSummaryDto {
    private final Integer courseId;
    private final String courseTitle;
    private final Integer quizId;
    private final String quizTitle;
    private final boolean attempted;
    private final BigDecimal bestScore;

    public CourseTestSummaryDto(
            Integer courseId,
            String courseTitle,
            Integer quizId,
            String quizTitle,
            boolean attempted,
            BigDecimal bestScore
    ) {
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.quizId = quizId;
        this.quizTitle = quizTitle;
        this.attempted = attempted;
        this.bestScore = bestScore;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public Integer getQuizId() {
        return quizId;
    }

    public String getQuizTitle() {
        return quizTitle;
    }

    public boolean isAttempted() {
        return attempted;
    }

    public BigDecimal getBestScore() {
        return bestScore;
    }
}
