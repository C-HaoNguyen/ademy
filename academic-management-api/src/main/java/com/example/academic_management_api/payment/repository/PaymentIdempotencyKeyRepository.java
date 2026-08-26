package com.example.academic_management_api.payment.repository;

import com.example.academic_management_api.payment.entity.PaymentIdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentIdempotencyKeyRepository extends JpaRepository<PaymentIdempotencyKey, String> {
}
