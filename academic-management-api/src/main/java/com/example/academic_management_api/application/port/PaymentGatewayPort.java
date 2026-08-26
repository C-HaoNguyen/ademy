package com.example.academic_management_api.application.port;

import java.math.BigDecimal;
import java.util.Map;

public interface PaymentGatewayPort {

    /**
     * Định danh gateway (vd. "vnpay", "momo", "stripe") — dùng để chọn adapter theo
     * {@code PaymentMethod} client gửi (ADR-009, Strategy pattern). Là String thuần thay vì
     * enum của module {@code payment} để port ở tầng {@code application} không phụ thuộc ngược
     * vào entity của feature module, đúng nguyên tắc ADR-014.
     */
    String gatewayId();

    CheckoutSession createCheckoutSession(CheckoutRequest request);

    CallbackResult verifyCallback(CallbackPayload payload);

    record CheckoutRequest(String transactionRef, BigDecimal amount, String orderInfo) {
    }

    record CheckoutSession(String redirectUrl, String gatewayTransactionRef) {
    }

    /**
     * Payload callback/webhook thô — hình dạng khác nhau tùy gateway: VNPay/Momo dùng
     * {@code params} (query string / JSON field phẳng), Stripe dùng {@code rawBody} +
     * {@code signatureHeader} (chữ ký ký trên toàn bộ raw JSON body).
     */
    record CallbackPayload(Map<String, String> params, String rawBody, String signatureHeader) {
    }

    record CallbackResult(boolean signatureValid, String transactionRef, boolean success) {
    }
}
