package com.example.academic_management_api.payment.refund.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

// ADR-010 — theo dõi việc hoàn tiền thực tế đã xảy ra chưa, tách khỏi RefundBusinessStatus (quyết
// định nghiệp vụ của Admin). Phase 1 (ADR-011) chỉ có MANUAL_COMPLETED — không có trạng thái
// "đang xử lý qua gateway" vì chưa có gateway refund thật nào được gọi.
public enum RefundExecutionStatus {
    NOT_STARTED,
    MANUAL_COMPLETED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static RefundExecutionStatus fromValue(String value) {
        return RefundExecutionStatus.valueOf(value.toUpperCase());
    }
}
