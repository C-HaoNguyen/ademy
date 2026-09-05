package com.example.academic_management_api.payment.repository;

import com.example.academic_management_api.payment.entity.PaymentStatus;
import com.example.academic_management_api.payment.entity.Payments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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

    // Phase 29 — AdminDashboard "Tổng doanh thu". SUM trên state-field BigDecimal trả về BigDecimal
    // theo JPA spec §4.8.5 (khác AVG luôn trả Double bất kể kiểu cột gốc — bug đã gặp ở Phase 28),
    // nên khai BigDecimal ở đây là đúng, không cần convert qua Double. COALESCE về 0 khi chưa có
    // payment SUCCESS nào (SUM trên tập rỗng trả NULL).
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payments p WHERE p.status = com.example.academic_management_api.payment.entity.PaymentStatus.SUCCESS")
    BigDecimal sumAmountByStatusSuccess();

    // Phase 28 — Student tự tra payment của chính mình (MyCourses cần paymentId theo course).
    @Query("""
        SELECT p FROM Payments p
        JOIN FETCH p.course
        WHERE p.student.userId = :studentId
        ORDER BY p.createdAt DESC
        """)
    List<Payments> findByStudent_UserIdOrderByCreatedAtDesc(@Param("studentId") Integer studentId);

    // Update có điều kiện — chỉ chuyển trạng thái khi đang PENDING (EC-002, Phase 21). Nếu 0 row bị
    // ảnh hưởng nghĩa là callback này tới muộn/lặp lại sau khi trạng thái đã được xác định trước đó
    // (bởi 1 callback khác) — caller coi đó là no-op idempotent, không xử lý lại (không tạo enrollment
    // lần 2). Single UPDATE statement là atomic ở mức DB, không cần lock thủ công.
    @Modifying
    @Query("UPDATE Payments p SET p.status = :newStatus WHERE p.paymentId = :paymentId AND p.status = com.example.academic_management_api.payment.entity.PaymentStatus.PENDING")
    int updateStatusIfPending(@Param("paymentId") Integer paymentId, @Param("newStatus") PaymentStatus newStatus);
}
