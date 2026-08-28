package com.example.academic_management_api.payment.dto;

import java.math.BigDecimal;

// Trả về khi Student bấm "Áp dụng" ở Checkout Bước 1 (UI_SPEC §2.8) — chỉ preview, KHÔNG
// increment redemption_count/ghi coupon_redemptions (đó chỉ xảy ra tại checkout thật).
public class CouponPreviewResponse {
    private final BigDecimal discountAmount;
    private final BigDecimal finalAmount;

    public CouponPreviewResponse(BigDecimal discountAmount, BigDecimal finalAmount) {
        this.discountAmount = discountAmount;
        this.finalAmount = finalAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }
}
