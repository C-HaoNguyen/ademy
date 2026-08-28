package com.example.academic_management_api.payment.coupon.controller;

import com.example.academic_management_api.payment.coupon.dto.CouponRequest;
import com.example.academic_management_api.payment.coupon.dto.CouponResponse;
import com.example.academic_management_api.payment.coupon.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Route /admin/coupons/** đã nằm dưới /admin/** -> hasRole("ADMIN") ở SecurityConfig (BR-003: chỉ
// Admin tạo coupon), không cần thêm matcher riêng.
@RestController
@RequestMapping("/admin/coupons")
public class AdminCouponController {
    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public List<CouponResponse> getAllCoupons() {
        return couponService.getAllCoupons();
    }

    @PostMapping
    public CouponResponse createCoupon(@Valid @RequestBody CouponRequest request) {
        return couponService.createCoupon(request);
    }

    @PutMapping("/{id}")
    public CouponResponse updateCoupon(@PathVariable Integer id, @Valid @RequestBody CouponRequest request) {
        return couponService.updateCoupon(id, request);
    }

    @PostMapping("/{id}/deactivate")
    public void deactivateCoupon(@PathVariable Integer id) {
        couponService.deactivateCoupon(id);
    }
}
