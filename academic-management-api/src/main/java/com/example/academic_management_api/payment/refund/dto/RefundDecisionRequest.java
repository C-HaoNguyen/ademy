package com.example.academic_management_api.payment.refund.dto;

import jakarta.validation.constraints.NotBlank;

// Dùng cho "Từ chối" — UI_SPEC §5.7 yêu cầu Admin nhập lý do khi từ chối.
public class RefundDecisionRequest {
    @NotBlank(message = "Reason is required")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
