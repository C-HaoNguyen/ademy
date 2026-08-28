package com.example.academic_management_api.payment.refund.dto;

import com.example.academic_management_api.payment.refund.entity.RefundBusinessStatus;
import com.example.academic_management_api.payment.refund.entity.RefundExecutionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// DTO phẳng thay vì trả entity trực tiếp — tránh serialize lazy-proxy Jackson chưa initialize
// (cùng lớp bug đã fix ở Phase 18/22), cùng pattern CouponResponse.
public class RefundResponse {
    private final Integer id;
    private final Integer paymentId;
    private final Integer studentId;
    private final Integer courseId;
    private final String courseTitle;
    private final BigDecimal amount;
    private final String reason;
    private final RefundBusinessStatus businessStatus;
    private final String adminNote;
    private final RefundExecutionStatus executionStatus;
    private final String gatewayRefundReference;
    private final LocalDateTime requestedAt;
    private final LocalDateTime decidedAt;
    private final LocalDateTime completedAt;

    public RefundResponse(
            Integer id,
            Integer paymentId,
            Integer studentId,
            Integer courseId,
            String courseTitle,
            BigDecimal amount,
            String reason,
            RefundBusinessStatus businessStatus,
            String adminNote,
            RefundExecutionStatus executionStatus,
            String gatewayRefundReference,
            LocalDateTime requestedAt,
            LocalDateTime decidedAt,
            LocalDateTime completedAt
    ) {
        this.id = id;
        this.paymentId = paymentId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.courseTitle = courseTitle;
        this.amount = amount;
        this.reason = reason;
        this.businessStatus = businessStatus;
        this.adminNote = adminNote;
        this.executionStatus = executionStatus;
        this.gatewayRefundReference = gatewayRefundReference;
        this.requestedAt = requestedAt;
        this.decidedAt = decidedAt;
        this.completedAt = completedAt;
    }

    public Integer getId() {
        return id;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public Integer getStudentId() {
        return studentId;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getCourseTitle() {
        return courseTitle;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getReason() {
        return reason;
    }

    public RefundBusinessStatus getBusinessStatus() {
        return businessStatus;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public RefundExecutionStatus getExecutionStatus() {
        return executionStatus;
    }

    public String getGatewayRefundReference() {
        return gatewayRefundReference;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
