package com.example.academic_management_api.payment.coupon.repository;

import com.example.academic_management_api.payment.coupon.entity.Coupons;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupons, Integer> {

    Optional<Coupons> findByCode(String code);

    boolean existsByCode(String code);

    @Query("""
        SELECT c FROM Coupons c
        LEFT JOIN FETCH c.course
        ORDER BY c.createdAt DESC
        """)
    List<Coupons> findAllWithDetails();

    // Update có điều kiện — chỉ tăng redemption_count khi coupon vẫn active, chưa hết hạn, và chưa
    // vượt max_redemptions (hoặc không giới hạn). Recheck cả active/expiresAt ở đây (không chỉ ở
    // CouponService.resolveValidCoupon()) để đóng race window: Admin có thể deactivate/coupon có
    // thể hết hạn giữa lúc resolveValidCoupon() đọc xong và lúc method này chạy (khoảng cách là thời
    // gian persist 1 payment). Single UPDATE statement atomic ở mức DB, tránh race condition 2
    // checkout đồng thời cùng vượt quá giới hạn (cùng nguyên tắc PaymentRepository.updateStatusIfPending,
    // Phase 21).
    @Modifying
    @Query("""
        UPDATE Coupons c SET c.redemptionCount = c.redemptionCount + 1
        WHERE c.id = :id
          AND c.active = true
          AND (c.expiresAt IS NULL OR c.expiresAt > :now)
          AND (c.maxRedemptions IS NULL OR c.redemptionCount < c.maxRedemptions)
        """)
    int incrementRedemptionIfAllowed(@Param("id") Integer id, @Param("now") LocalDateTime now);
}
