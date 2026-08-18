package com.example.academic_management_api.payment.repository;

import com.example.academic_management_api.payment.entity.Payments;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payments, Integer> {

}
