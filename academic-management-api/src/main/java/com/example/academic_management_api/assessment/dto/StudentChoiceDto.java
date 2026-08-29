package com.example.academic_management_api.assessment.dto;

import com.example.academic_management_api.assessment.entity.QuizChoices;

public class StudentChoiceDto {
    private final Integer id;
    private final String choiceText;
    private final Integer orderIndex;

    public StudentChoiceDto(QuizChoices choice) {
        this.id = choice.getId();
        this.choiceText = choice.getChoiceText();
        this.orderIndex = choice.getOrderIndex();
    }

    public Integer getId() {
        return id;
    }

    public String getChoiceText() {
        return choiceText;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }
}
