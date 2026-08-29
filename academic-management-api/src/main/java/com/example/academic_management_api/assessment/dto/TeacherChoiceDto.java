package com.example.academic_management_api.assessment.dto;

import com.example.academic_management_api.assessment.entity.QuizChoices;

public class TeacherChoiceDto {
    private final Integer id;
    private final String choiceText;
    private final Boolean isCorrect;
    private final Integer orderIndex;

    public TeacherChoiceDto(QuizChoices choice) {
        this.id = choice.getId();
        this.choiceText = choice.getChoiceText();
        this.isCorrect = choice.getCorrect();
        this.orderIndex = choice.getOrderIndex();
    }

    public Integer getId() {
        return id;
    }

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
