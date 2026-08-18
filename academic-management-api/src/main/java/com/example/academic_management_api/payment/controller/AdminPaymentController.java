package com.example.academic_management_api.payment.controller;

import com.example.academic_management_api.payment.entity.Payments;
import com.example.academic_management_api.payment.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminPaymentController {
    private final PaymentService paymentService;

    public AdminPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/payments")
    public List<Payments> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @GetMapping("/total-payments")
    public ResponseEntity<?> getTotalPayments() {
        long totalPayments = paymentService.getTotalPayments();

        return ResponseEntity.ok(
                Map.of("totalPayments", totalPayments)
        );
    }
}
