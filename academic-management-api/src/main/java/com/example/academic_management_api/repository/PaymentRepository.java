package com.example.academic_management_api.repository;

import com.example.academic_management_api.entity.Payments;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payments, Integer> {

}
