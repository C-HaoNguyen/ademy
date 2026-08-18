package com.example.academic_management_api.payment.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PaymentStatus {
    PENDING,
    SUCCESS,
    FAILED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static PaymentStatus fromValue(String value) {
        return PaymentStatus.valueOf(value.toUpperCase());
    }
}
