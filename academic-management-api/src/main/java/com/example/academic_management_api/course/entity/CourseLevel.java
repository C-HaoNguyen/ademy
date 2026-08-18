package com.example.academic_management_api.course.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CourseLevel {
    BEGINNER,
    INTERMEDIATE,
    ADVANCED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static CourseLevel fromValue(String value) {
        return CourseLevel.valueOf(value.toUpperCase());
    }
}
