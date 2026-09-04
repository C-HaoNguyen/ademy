package com.example.academic_management_api.payment.dto;

import com.example.academic_management_api.payment.entity.PaymentStatus;

// Student tự tra payment của chính mình theo course (Phase 28: MyCourses cần paymentId để gắn
// action hoàn tiền ở phase sau — expose sẵn field này rẻ vì đã touch PaymentRepository ở đây,
// nhưng UI hoàn tiền (Modal/Idempotency-Key) chưa build, chỉ trả dữ liệu).
public class MyPaymentDto {
    private final Integer paymentId;
    private final Integer courseId;
    private final PaymentStatus status;

    public MyPaymentDto(Integer paymentId, Integer courseId, PaymentStatus status) {
        this.paymentId = paymentId;
        this.courseId = courseId;
        this.status = status;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public PaymentStatus getStatus() {
        return status;
    }
}
