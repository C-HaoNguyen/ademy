package com.example.academic_management_api.payment.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentMethod {
    VNPAY,
    MOMO,
    STRIPE;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static PaymentMethod fromValue(String value) {
        return PaymentMethod.valueOf(value.toUpperCase());
    }
}
