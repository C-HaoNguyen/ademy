package com.example.academic_management_api.payment.refund.repository;

import com.example.academic_management_api.payment.entity.Payments;
import com.example.academic_management_api.payment.refund.entity.RefundBusinessStatus;
import com.example.academic_management_api.payment.refund.entity.RefundRequests;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefundRequestRepository extends JpaRepository<RefundRequests, Integer> {

    // JOIN FETCH payment/course/student — tránh serialize lazy-proxy chưa initialize khi map sang
    // RefundResponse (cùng lớp bug đã fix ở Phase 18/22).
    @Query("""
        SELECT r FROM RefundRequests r
        JOIN FETCH r.payment p
        JOIN FETCH p.course
        JOIN FETCH r.student
        WHERE r.id = :id
        """)
    Optional<RefundRequests> findByIdWithDetails(@Param("id") Integer id);

    @Query("""
        SELECT r FROM RefundRequests r
        JOIN FETCH r.payment p
        JOIN FETCH p.course
        JOIN FETCH r.student
        ORDER BY r.requestedAt DESC
        """)
    List<RefundRequests> findAllWithDetails();

    // Fast-path kiểm tra sớm cho createRequest() — trả lỗi rõ ràng ngay khi có thể, nhưng KHÔNG đủ
    // để đóng race 2 request đồng thời cùng payment (2 transaction đều đọc "chưa có request nào"
    // trước khi transaction nào commit). Ràng buộc thật nằm ở partial unique index
    // refund_requests_active_payment_uq (V8) — RefundService bắt DataIntegrityViolationException
    // khi vi phạm, cùng nguyên tắc PaymentService/isAlreadyEnrolled + enrollments_active_student_course_uq.
    boolean existsByPaymentAndBusinessStatusNot(Payments payment, RefundBusinessStatus businessStatus);

    // Phase 29 — AdminDashboard "Yêu cầu hoàn tiền đang chờ duyệt" (danh sách rút gọn). Pageable
    // giới hạn số dòng (JPQL không có LIMIT trực tiếp) — caller truyền PageRequest.of(0, N).
    @Query("""
        SELECT r FROM RefundRequests r
        JOIN FETCH r.payment p
        JOIN FETCH p.course
        JOIN FETCH r.student
        WHERE r.businessStatus = :businessStatus
        ORDER BY r.requestedAt DESC
        """)
    List<RefundRequests> findByBusinessStatusOrderByRequestedAtDesc(
            @Param("businessStatus") RefundBusinessStatus businessStatus, Pageable pageable);

    // Update có điều kiện — chỉ chuyển REQUESTED -> APPROVED/REJECTED, cùng nguyên tắc
    // PaymentRepository.updateStatusIfPending (Phase 21): đóng race 2 admin (hoặc double-click)
    // cùng duyệt/từ chối 1 request — chỉ 1 request thắng (updated == 1), request thua nhận
    // ConflictException, không gửi email lần 2.
    @Modifying
    @Query("""
        UPDATE RefundRequests r
        SET r.businessStatus = :newStatus, r.adminNote = :adminNote, r.decidedAt = :decidedAt
        WHERE r.id = :id
          AND r.businessStatus = com.example.academic_management_api.payment.refund.entity.RefundBusinessStatus.REQUESTED
        """)
    int updateBusinessStatusIfRequested(
            @Param("id") Integer id,
            @Param("newStatus") RefundBusinessStatus newStatus,
            @Param("adminNote") String adminNote,
            @Param("decidedAt") LocalDateTime decidedAt);

    // "Claim" độc quyền TRƯỚC khi gọi RefundGatewayPort — chỉ 1 transaction thắng (claimed == 1) mới
    // được phép gọi gateway; transaction thua nhận ConflictException ngay, không gọi gateway lần nào.
    // Nếu gateway trả success=false sau đó, RefundService throw để @Transactional rollback toàn bộ
    // UPDATE này — request quay lại đúng APPROVED/NOT_STARTED, không kẹt ở trạng thái sai.
    @Modifying
    @Query("""
        UPDATE RefundRequests r
        SET r.executionStatus = com.example.academic_management_api.payment.refund.entity.RefundExecutionStatus.MANUAL_COMPLETED,
            r.completedAt = :completedAt
        WHERE r.id = :id
          AND r.businessStatus = com.example.academic_management_api.payment.refund.entity.RefundBusinessStatus.APPROVED
          AND r.executionStatus = com.example.academic_management_api.payment.refund.entity.RefundExecutionStatus.NOT_STARTED
        """)
    int claimForManualCompletion(@Param("id") Integer id, @Param("completedAt") LocalDateTime completedAt);
}
