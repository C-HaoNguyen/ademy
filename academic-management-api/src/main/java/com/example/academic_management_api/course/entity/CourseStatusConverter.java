package com.example.academic_management_api.course.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class CourseStatusConverter implements AttributeConverter<CourseStatus, String> {

    @Override
    public String convertToDatabaseColumn(CourseStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public CourseStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : CourseStatus.valueOf(dbData.toUpperCase());
    }
}
