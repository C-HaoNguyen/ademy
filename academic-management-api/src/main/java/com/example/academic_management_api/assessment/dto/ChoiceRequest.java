package com.example.academic_management_api.assessment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ChoiceRequest {
    @NotBlank
    private String choiceText;

    @NotNull
    private Boolean isCorrect;

    @NotNull
    private Integer orderIndex;

    public String getChoiceText() {
        return choiceText;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }
}
