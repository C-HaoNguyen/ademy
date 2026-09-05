package com.example.academic_management_api.payment.refund.controller;

import com.example.academic_management_api.payment.refund.dto.RefundDecisionRequest;
import com.example.academic_management_api.payment.refund.dto.RefundResponse;
import com.example.academic_management_api.payment.refund.service.RefundService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Route /admin/refund-requests/** đã nằm dưới /admin/** -> hasRole("ADMIN") ở SecurityConfig,
// không cần thêm matcher riêng.
@RestController
@RequestMapping("/admin/refund-requests")
public class AdminRefundController {
    private final RefundService refundService;

    public AdminRefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @GetMapping
    public List<RefundResponse> getAll() {
        return refundService.getAll();
    }

    // Phase 29 — AdminDashboard danh sách rút gọn (top 5 REQUESTED gần nhất).
    @GetMapping("/pending-preview")
    public List<RefundResponse> getPendingPreview() {
        return refundService.getRecentPending(5);
    }

    @PostMapping("/{id}/approve")
    public RefundResponse approve(@PathVariable Integer id) {
        return refundService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public RefundResponse reject(@PathVariable Integer id, @Valid @RequestBody RefundDecisionRequest request) {
        return refundService.reject(id, request.getReason());
    }

    @PostMapping("/{id}/mark-completed")
    public RefundResponse markCompleted(@PathVariable Integer id) {
        return refundService.markCompleted(id);
    }
}
