package com.example.academic_management_api.payment.coupon.dto;

import com.example.academic_management_api.payment.coupon.entity.CouponDiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CouponRequest {
    @NotBlank(message = "Coupon code is required")
    private String code;

    @NotNull(message = "Discount type is required")
    private CouponDiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0", inclusive = false, message = "Discount value must be greater than 0")
    private BigDecimal discountValue;

    // null = áp dụng toàn nền tảng.
    private Integer courseId;

    // null = không giới hạn lượt dùng.
    @Positive(message = "Max redemptions must be greater than 0")
    private Integer maxRedemptions;

    private LocalDateTime expiresAt;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public CouponDiscountType getDiscountType() {
        return discountType;
    }

    public void setDiscountType(CouponDiscountType discountType) {
        this.discountType = discountType;
    }

    public BigDecimal getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(BigDecimal discountValue) {
        this.discountValue = discountValue;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }

    public Integer getMaxRedemptions() {
        return maxRedemptions;
    }

    public void setMaxRedemptions(Integer maxRedemptions) {
        this.maxRedemptions = maxRedemptions;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
}
