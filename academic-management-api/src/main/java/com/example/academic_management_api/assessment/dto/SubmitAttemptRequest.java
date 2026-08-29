package com.example.academic_management_api.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class SubmitAttemptRequest {
    @NotNull
    private Integer quizId;

    @NotEmpty
    @Valid
    private List<AnswerRequest> answers;

    public Integer getQuizId() {
        return quizId;
    }

    public List<AnswerRequest> getAnswers() {
        return answers;
    }
}
