package com.example.academic_management_api.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class QuizRequest {
    @NotBlank
    private String title;

    @NotEmpty
    @Valid
    private List<QuestionRequest> questions;

    public String getTitle() {
        return title;
    }

    public List<QuestionRequest> getQuestions() {
        return questions;
    }
}
