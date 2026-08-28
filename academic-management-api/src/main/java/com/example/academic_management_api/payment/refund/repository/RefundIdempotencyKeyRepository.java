package com.example.academic_management_api.payment.refund.repository;

import com.example.academic_management_api.payment.refund.entity.RefundIdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefundIdempotencyKeyRepository extends JpaRepository<RefundIdempotencyKey, String> {
}
