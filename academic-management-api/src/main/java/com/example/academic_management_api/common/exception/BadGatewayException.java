package com.example.academic_management_api.common.exception;

/**
 * Gateway thanh toán (VNPay/Momo/Stripe) từ chối yêu cầu hoặc không gọi được (Phase 21) — khác
 * {@link ServiceUnavailableException} (thiếu cấu hình phía ta): đây là lỗi tới từ phía bên thứ 3.
 */
public class BadGatewayException extends RuntimeException {
    public BadGatewayException(String message) {
        super(message);
    }
}
