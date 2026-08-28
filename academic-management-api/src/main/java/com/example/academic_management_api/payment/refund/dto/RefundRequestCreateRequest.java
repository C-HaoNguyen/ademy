package com.example.academic_management_api.payment.refund.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RefundRequestCreateRequest {
    @NotNull(message = "Payment id is required")
    private Integer paymentId;

    @NotBlank(message = "Reason is required")
    private String reason;

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
