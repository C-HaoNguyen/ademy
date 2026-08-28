package com.example.academic_management_api.payment.coupon.repository;

import com.example.academic_management_api.payment.coupon.entity.CouponRedemptions;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRedemptionRepository extends JpaRepository<CouponRedemptions, Integer> {
}
