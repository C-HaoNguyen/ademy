package com.example.academic_management_api.payment.coupon.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CouponDiscountType {
    PERCENTAGE,
    FIXED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static CouponDiscountType fromValue(String value) {
        return CouponDiscountType.valueOf(value.toUpperCase());
    }
}
