package com.example.academic_management_api.payment.dto;

public class PaymentResponse {
    private boolean success;
    private String message;
    // Chỉ có giá trị ở "live" mode (Phase 21) — URL để redirect Student sang cổng thanh toán thật.
    private String redirectUrl;

    public PaymentResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }
}
