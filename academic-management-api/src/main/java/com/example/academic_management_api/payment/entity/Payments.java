package com.example.academic_management_api.payment.entity;

import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.payment.coupon.entity.Coupons;
import com.example.academic_management_api.user.entity.Users;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payments {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Users student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Courses course;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Convert(converter = PaymentStatusConverter.class)
    private PaymentStatus status;

    // Chỉ có giá trị ở "live" mode (Phase 21) — dùng để đối chiếu callback/webhook thật với đúng
    // payment record (vnp_TxnRef/orderId/client_reference_id gửi cho gateway chính là Idempotency-Key
    // của request checkout). Uniqueness thật sự được enforce bằng partial index ở migration V6
    // (chỉ áp dụng khi not null) — không khai @Column(unique = true) ở đây để tránh ngụ ý sai kiểu
    // ràng buộc so với DB thật.
    @Column(name = "gateway_transaction_ref", length = 100)
    private String gatewayTransactionRef;

    // null = checkout không dùng coupon (Phase 22).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupons coupon;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public Users getStudent() {
        return student;
    }

    public Courses getCourse() {
        return course;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getGatewayTransactionRef() {
        return gatewayTransactionRef;
    }

    public void setGatewayTransactionRef(String gatewayTransactionRef) {
        this.gatewayTransactionRef = gatewayTransactionRef;
    }

    // Không JOIN FETCH ở PaymentRepository.findAllWithDetails() (AdminPaymentController trả raw
    // entity) và UI_SPEC §5.5 (AdminOrders) không có cột coupon — @JsonIgnore để tránh serialize
    // proxy LAZY chưa initialize (cùng lớp bug lazy-proxy đã fix ở Phase 18), không phải vì thiếu dữ
    // liệu (coupon vẫn dùng được nội bộ qua getCoupon() ở code Java, chỉ không lộ ra JSON response).
    @JsonIgnore
    public Coupons getCoupon() {
        return coupon;
    }

    public void setCoupon(Coupons coupon) {
        this.coupon = coupon;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public void setStudent(Users student) {
        this.student = student;
    }

    public void setCourse(Courses course) {
        this.course = course;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
