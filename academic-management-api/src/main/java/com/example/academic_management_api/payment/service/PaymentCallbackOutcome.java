package com.example.academic_management_api.payment.service;

/**
 * Kết quả xử lý 1 callback/webhook gateway (Phase 21) — Controller dùng để build đúng hình dạng
 * ack riêng của từng gateway (VNPay/Momo/Stripe có convention response khác nhau).
 */
public enum PaymentCallbackOutcome {
    INVALID_SIGNATURE,
    NOT_FOUND,
    // Chữ ký hợp lệ nhưng không có transactionRef để xử lý (vd. Stripe gửi loại event ta không quan tâm).
    IGNORED,
    ALREADY_PROCESSED,
    PROCESSED
}
