package com.example.academic_management_api.payment.coupon.dto;

import com.example.academic_management_api.payment.coupon.entity.CouponDiscountType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// DTO phẳng thay vì trả entity trực tiếp — tránh lặp lại bug lazy-proxy Jackson đã gặp ở
// CourseController (Phase 18): course lồng trong Coupons vẫn LAZY, không JOIN FETCH sâu tới
// instructor/category nên không serialize entity đó trực tiếp.
public class CouponResponse {
    private final Integer id;
    private final String code;
    private final CouponDiscountType discountType;
    private final BigDecimal discountValue;
    private final Integer courseId;
    private final String courseTitle;
    private final Integer maxRedemptions;
    private final int redemptionCount;
    private final LocalDateTime expiresAt;
    private final boolean active;
    private final LocalDateTime createdAt;

    public CouponResponse(
            Integer id,
            String code,
            CouponDiscountType discountType,
            BigDecimal discountValue,
            Integer courseId,
            String courseTitle,
            Integer maxRedemptions,
            int redemptionCount,
            LocalDateTime expiresAt,
            boolean active,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.code = code;
        this.discountType = discountType;
        this.discountValue = discountValue;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.maxRedemptions = maxRedemptions;
        this.redemptionCount = redemptionCount;
        this.expiresAt = expiresAt;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public CouponDiscountType getDiscountType() {
        return discountType;
    }

    public BigDecimal getDiscountValue() {
        return discountValue;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public Integer getMaxRedemptions() {
        return maxRedemptions;
    }

    public int getRedemptionCount() {
        return redemptionCount;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
