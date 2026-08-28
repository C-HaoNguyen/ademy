package com.example.academic_management_api.payment.refund.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RefundBusinessStatusConverter implements AttributeConverter<RefundBusinessStatus, String> {

    @Override
    public String convertToDatabaseColumn(RefundBusinessStatus attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public RefundBusinessStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : RefundBusinessStatus.valueOf(dbData.toUpperCase());
    }
}
