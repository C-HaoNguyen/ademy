package com.example.academic_management_api.payment.dto;

import com.example.academic_management_api.payment.entity.PaymentStatus;

import java.math.BigDecimal;

// Checkout Bước 3 (UI_SPEC §2.10) — Student tra trạng thái giao dịch sau khi gateway redirect về
// bằng gatewayTransactionRef (Idempotency-Key của lần checkout đó, xem PaymentService.initiateGatewaySession).
public class PaymentStatusResponse {
    private final PaymentStatus status;
    private final Integer courseId;
    private final String courseTitle;
    private final BigDecimal amount;
    private final String gatewayTransactionRef;

    public PaymentStatusResponse(
            PaymentStatus status,
            Integer courseId,
            String courseTitle,
            BigDecimal amount,
            String gatewayTransactionRef
    ) {
        this.status = status;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.amount = amount;
        this.gatewayTransactionRef = gatewayTransactionRef;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getGatewayTransactionRef() {
        return gatewayTransactionRef;
    }
}
