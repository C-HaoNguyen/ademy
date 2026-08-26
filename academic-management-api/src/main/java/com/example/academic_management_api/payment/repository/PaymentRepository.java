package com.example.academic_management_api.payment.repository;

import com.example.academic_management_api.payment.entity.PaymentStatus;
import com.example.academic_management_api.payment.entity.Payments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payments, Integer> {

    @Query("""
        SELECT p FROM Payments p
        JOIN FETCH p.student
        JOIN FETCH p.course c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        """)
    List<Payments> findAllWithDetails();

    Optional<Payments> findByGatewayTransactionRef(String gatewayTransactionRef);

    // Update có điều kiện — chỉ chuyển trạng thái khi đang PENDING (EC-002, Phase 21). Nếu 0 row bị
    // ảnh hưởng nghĩa là callback này tới muộn/lặp lại sau khi trạng thái đã được xác định trước đó
    // (bởi 1 callback khác) — caller coi đó là no-op idempotent, không xử lý lại (không tạo enrollment
    // lần 2). Single UPDATE statement là atomic ở mức DB, không cần lock thủ công.
    @Modifying
    @Query("UPDATE Payments p SET p.status = :newStatus WHERE p.paymentId = :paymentId AND p.status = com.example.academic_management_api.payment.entity.PaymentStatus.PENDING")
    int updateStatusIfPending(@Param("paymentId") Integer paymentId, @Param("newStatus") PaymentStatus newStatus);
}
