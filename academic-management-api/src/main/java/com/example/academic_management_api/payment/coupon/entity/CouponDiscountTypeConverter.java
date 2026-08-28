package com.example.academic_management_api.payment.coupon.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class CouponDiscountTypeConverter implements AttributeConverter<CouponDiscountType, String> {

    @Override
    public String convertToDatabaseColumn(CouponDiscountType attribute) {
        return attribute == null ? null : attribute.name().toLowerCase();
    }

    @Override
    public CouponDiscountType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : CouponDiscountType.valueOf(dbData.toUpperCase());
    }
}
