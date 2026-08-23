package com.example.academic_management_api.payment.controller;

import com.example.academic_management_api.payment.dto.PaymentRequest;
import com.example.academic_management_api.payment.dto.PaymentResponse;
import com.example.academic_management_api.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    public ResponseEntity<PaymentResponse> checkout(@Valid @RequestBody PaymentRequest request, Authentication authentication) {
        return paymentService.checkout(request, authentication.getName());
    }
}
