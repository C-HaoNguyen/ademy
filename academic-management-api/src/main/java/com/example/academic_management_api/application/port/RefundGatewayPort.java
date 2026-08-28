package com.example.academic_management_api.application.port;

import java.math.BigDecimal;

public interface RefundGatewayPort {

    /**
     * Định danh adapter (vd. "manual") — Phase 1 (ADR-011) chỉ có 1 implementation
     * ({@code ManualRefundGateway}); {@code VnPayRefundGateway}/{@code MomoRefundGateway}/
     * {@code StripeRefundGateway} triển khai ở Phase 2 mà không đổi interface này.
     */
    String gatewayId();

    RefundOutcome executeRefund(RefundContext context);

    record RefundContext(Integer refundRequestId, BigDecimal amount, String orderInfo) {
    }

    record RefundOutcome(boolean success, String gatewayRefundReference) {
    }
}
