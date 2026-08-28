package com.example.academic_management_api.payment.refund.entity;

import com.example.academic_management_api.user.entity.Users;
import jakarta.persistence.*;

import java.time.LocalDateTime;

// Dedup riêng cho POST /refund-requests theo Idempotency-Key (ADR-007) — không tái dùng
// PaymentIdempotencyKey vì payment_id ở bảng đó NOT NULL, khóa cứng cho checkout (Phase 19). Cùng
// cơ chế (client sinh UUID, server lưu bảng dedup riêng, replay kết quả request đầu tiên), khác
// bảng vật lý — xem V8__refund_domain.sql.
@Entity
@Table(name = "refund_idempotency_keys")
public class RefundIdempotencyKey {
    @Id
    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Users student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_request_id", nullable = false)
    private RefundRequests refundRequest;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Users getStudent() {
        return student;
    }

    public void setStudent(Users student) {
        this.student = student;
    }

    public RefundRequests getRefundRequest() {
        return refundRequest;
    }

    public void setRefundRequest(RefundRequests refundRequest) {
        this.refundRequest = refundRequest;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
