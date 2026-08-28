package com.example.academic_management_api.payment.refund.entity;

import com.example.academic_management_api.payment.entity.Payments;
import com.example.academic_management_api.user.entity.Users;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "refund_requests")
public class RefundRequests {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payments payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Users student;

    @Column(nullable = false)
    private String reason;

    @Convert(converter = RefundBusinessStatusConverter.class)
    @Column(name = "business_status", nullable = false, length = 20)
    private RefundBusinessStatus businessStatus;

    @Column(name = "admin_note")
    private String adminNote;

    @Convert(converter = RefundExecutionStatusConverter.class)
    @Column(name = "execution_status", nullable = false, length = 20)
    private RefundExecutionStatus executionStatus;

    @Column(name = "gateway_refund_reference", length = 100)
    private String gatewayRefundReference;

    @Column(name = "requested_at", updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    void onCreate() {
        requestedAt = LocalDateTime.now();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Payments getPayment() {
        return payment;
    }

    public void setPayment(Payments payment) {
        this.payment = payment;
    }

    public Users getStudent() {
        return student;
    }

    public void setStudent(Users student) {
        this.student = student;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public RefundBusinessStatus getBusinessStatus() {
        return businessStatus;
    }

    public void setBusinessStatus(RefundBusinessStatus businessStatus) {
        this.businessStatus = businessStatus;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }

    public RefundExecutionStatus getExecutionStatus() {
        return executionStatus;
    }

    public void setExecutionStatus(RefundExecutionStatus executionStatus) {
        this.executionStatus = executionStatus;
    }

    public String getGatewayRefundReference() {
        return gatewayRefundReference;
    }

    public void setGatewayRefundReference(String gatewayRefundReference) {
        this.gatewayRefundReference = gatewayRefundReference;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
