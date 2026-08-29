package com.example.academic_management_api.course.lesson.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum LessonContentType {
    VIDEO,
    DOCUMENT,
    QUIZ;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static LessonContentType fromValue(String value) {
        return LessonContentType.valueOf(value.toUpperCase());
    }
}
