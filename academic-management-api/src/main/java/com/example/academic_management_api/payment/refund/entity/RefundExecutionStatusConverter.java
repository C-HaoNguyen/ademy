package com.example.academic_management_api.payment.refund.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RefundExecutionStatusConverter implements AttributeConverter<RefundExecutionStatus, String> {

    @Override
    public String convertToDatabaseColumn(RefundExecutionStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public RefundExecutionStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : RefundExecutionStatus.valueOf(dbData.toUpperCase());
    }
}
