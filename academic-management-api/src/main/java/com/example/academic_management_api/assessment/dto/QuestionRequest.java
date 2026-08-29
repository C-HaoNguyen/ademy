package com.example.academic_management_api.assessment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class QuestionRequest {
    @NotBlank
    private String questionText;

    @NotNull
    private Integer orderIndex;

    @NotEmpty
    @Valid
    private List<ChoiceRequest> choices;

    public String getQuestionText() {
        return questionText;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public List<ChoiceRequest> getChoices() {
        return choices;
    }
}
