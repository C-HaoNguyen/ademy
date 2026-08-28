package com.example.academic_management_api.payment.refund.controller;

import com.example.academic_management_api.payment.refund.dto.RefundRequestCreateRequest;
import com.example.academic_management_api.payment.refund.dto.RefundResponse;
import com.example.academic_management_api.payment.refund.service.RefundService;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Route không có matcher riêng ở SecurityConfig -> rơi vào anyRequest().authenticated() mặc định
// (cùng tiền lệ /payments/checkout) — ownership (payment có thuộc đúng Student gọi request hay
// không) được RefundService kiểm tra, không phải role-level.
@RestController
@RequestMapping("/refund-requests")
public class RefundRequestController {
    private final RefundService refundService;

    public RefundRequestController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping
    public ResponseEntity<RefundResponse> createRequest(
            @Valid @RequestBody RefundRequestCreateRequest request,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(refundService.createRequest(request, idempotencyKey, authentication.getName()));
        } catch (DataIntegrityViolationException e) {
            // 2 nguồn gốc khả dĩ, cùng nguyên tắc PaymentController.checkout (Phase 19/21):
            // 1) Cùng Idempotency-Key gửi đồng thời (retry/double-click) -> request kia đã insert
            //    xong idempotency key này -> tìm thấy -> replay đúng kết quả của nó.
            // 2) Idempotency-Key khác nhau nhưng cùng payment được gửi đồng thời -> request kia
            //    thắng race và chiếm refund_requests_active_payment_uq trước (V8) -> idempotency key
            //    của request hiện tại chưa từng được lưu -> không tìm thấy -> resolveCreateConflict()
            //    ném ConflictException (409), đúng bản chất "giao dịch này đã có yêu cầu đang xử lý".
            // Gọi ở đây (không phải trong RefundService) để chạy ở transaction mới, vì transaction cũ
            // đã bị DB đánh dấu aborted.
            return ResponseEntity.ok(refundService.resolveCreateConflict(idempotencyKey));
        }
    }
}
