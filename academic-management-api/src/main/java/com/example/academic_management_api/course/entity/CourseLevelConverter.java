package com.example.academic_management_api.course.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class CourseLevelConverter implements AttributeConverter<CourseLevel, String> {

    @Override
    public String convertToDatabaseColumn(CourseLevel attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public CourseLevel convertToEntityAttribute(String dbData) {
        return dbData == null ? null : CourseLevel.valueOf(dbData.toUpperCase());
    }
}
