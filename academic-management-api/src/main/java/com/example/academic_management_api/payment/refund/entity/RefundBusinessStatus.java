package com.example.academic_management_api.payment.refund.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

// ADR-010 — quyết định nghiệp vụ của Admin, tách khỏi RefundExecutionStatus (việc hoàn tiền thực
// tế đã xảy ra chưa).
public enum RefundBusinessStatus {
    REQUESTED,
    APPROVED,
    REJECTED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static RefundBusinessStatus fromValue(String value) {
        return RefundBusinessStatus.valueOf(value.toUpperCase());
    }
}
