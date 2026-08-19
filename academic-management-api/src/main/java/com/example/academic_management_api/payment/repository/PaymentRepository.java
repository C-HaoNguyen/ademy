package com.example.academic_management_api.payment.repository;

import com.example.academic_management_api.payment.entity.Payments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payments, Integer> {

    @Query("""
        SELECT p FROM Payments p
        JOIN FETCH p.student
        JOIN FETCH p.course c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        """)
    List<Payments> findAllWithDetails();
}
