package com.example.academic_management_api.assessment.dto;

import com.example.academic_management_api.assessment.entity.QuizQuestions;

import java.util.List;

public class TeacherQuestionDto {
    private final Integer id;
    private final String questionText;
    private final Integer orderIndex;
    private final List<TeacherChoiceDto> choices;

    public TeacherQuestionDto(QuizQuestions question, List<TeacherChoiceDto> choices) {
        this.id = question.getId();
        this.questionText = question.getQuestionText();
        this.orderIndex = question.getOrderIndex();
        this.choices = choices;
    }

    public Integer getId() {
        return id;
    }

    public String getQuestionText() {
        return questionText;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public List<TeacherChoiceDto> getChoices() {
        return choices;
    }
}
