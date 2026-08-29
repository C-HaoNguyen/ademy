package com.example.academic_management_api.assessment.dto;

import jakarta.validation.constraints.NotNull;

public class AnswerRequest {
    @NotNull
    private Integer questionId;

    @NotNull
    private Integer choiceId;

    public Integer getQuestionId() {
        return questionId;
    }

    public Integer getChoiceId() {
        return choiceId;
    }
}
