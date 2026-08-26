package com.example.academic_management_api.payment.dto;

import com.example.academic_management_api.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public class PaymentRequest {
    @NotNull(message = "Course id is required")
    private Integer courseId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    public Integer getCourseId() {
        return courseId;
    }

    public void setCourseId(Integer courseId) {
        this.courseId = courseId;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
