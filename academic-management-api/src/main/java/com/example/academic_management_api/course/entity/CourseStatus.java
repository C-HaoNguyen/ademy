package com.example.academic_management_api.course.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CourseStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static CourseStatus fromValue(String value) {
        return CourseStatus.valueOf(value.toUpperCase());
    }
}
