package com.example.academic_management_api.assessment.dto;

import com.example.academic_management_api.assessment.entity.Quizzes;

import java.util.List;

public class QuizStudentResponseDto {
    private final Integer id;
    private final String title;
    private final List<StudentQuestionDto> questions;

    public QuizStudentResponseDto(Quizzes quiz, List<StudentQuestionDto> questions) {
        this.id = quiz.getId();
        this.title = quiz.getTitle();
        this.questions = questions;
    }

    public Integer getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public List<StudentQuestionDto> getQuestions() {
        return questions;
    }
}
