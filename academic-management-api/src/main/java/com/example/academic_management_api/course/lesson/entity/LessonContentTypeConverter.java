package com.example.academic_management_api.course.lesson.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class LessonContentTypeConverter implements AttributeConverter<LessonContentType, String> {

    @Override
    public String convertToDatabaseColumn(LessonContentType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public LessonContentType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : LessonContentType.valueOf(dbData.toUpperCase());
    }
}
