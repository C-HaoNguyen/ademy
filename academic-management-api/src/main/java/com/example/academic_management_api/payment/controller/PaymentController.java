package com.example.academic_management_api.payment.controller;

import com.example.academic_management_api.payment.dto.PaymentRequest;
import com.example.academic_management_api.payment.dto.PaymentResponse;
import com.example.academic_management_api.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/checkout")
    public ResponseEntity<PaymentResponse> checkout(
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            Authentication authentication
    ) {
        try {
            return paymentService.checkout(request, idempotencyKey, authentication.getName());
        } catch (DataIntegrityViolationException e) {
            // Một request khác (cùng Idempotency-Key, hoặc cùng student+course nhưng key khác)
            // đã thắng race condition và commit trước trong lúc transaction của request này đang
            // chạy — trả lại kết quả phù hợp thay vì lỗi 500 (ADR-007, EC-001). Gọi ở đây (không
            // phải trong PaymentService) để chạy trong một transaction mới, vì transaction cũ đã
            // bị DB đánh dấu aborted.
            return paymentService.resolveCheckoutConflict(idempotencyKey);
        }
    }
}
