package com.example.academic_management_api.audit.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Đánh dấu 1 service method là hành động nhạy cảm cần ghi audit log (ADR-012, PRD-033/034).
 * {@link com.example.academic_management_api.audit.aspect.AuditAspect} bắt method này qua AOP.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {

    /** Tên hành động, cố định tại call-site (không suy luận từ method name). */
    String action();

    /** Loại đối tượng bị tác động, ví dụ "COURSE", "USER". Để trống nếu không áp dụng. */
    String targetType() default "";

    /**
     * SpEL trỏ tới target id, đánh giá trên tham số method (theo tên) và biến {@code #result}
     * (giá trị trả về, chỉ có sau khi method chạy xong — dùng cho case id chỉ sinh ra sau khi tạo
     * mới, ví dụ "#result.body.courseId"). Để trống nếu không resolve được target id.
     */
    String targetIdExpression() default "";

    /**
     * SpEL trỏ tới actor, đánh giá trên tham số method (theo tên) — dùng cho case actor CHƯA
     * authenticate tại thời điểm method chạy (ví dụ login: "#request.username"). Để trống
     * (mặc định) để aspect tự lấy actor từ SecurityContextHolder — áp dụng cho mọi method khác đã
     * authenticated, không trộn 2 nguồn actor.
     */
    String actorExpression() default "";

    /**
     * Không ghi audit log khi method ném {@link org.springframework.dao.DataIntegrityViolationException}
     * — dùng cho method có pattern "saveAndFlush() rồi để race condition nổ ra thành exception này,
     * caller (controller) tự bắt và gọi 1 method resolve/replay khác ở transaction mới để trả kết
     * quả cuối cùng" (ví dụ PaymentService.checkout/createPendingPayment, RefundService.createRequest).
     * Method resolve/replay tương ứng phải tự có {@code @Audited} riêng để ghi lại kết quả thật —
     * nếu không set cờ này, request thắng-thua trong race sẽ bị ghi nhầm thành 1 lần "thất bại" dù
     * kết quả cuối cùng trả về cho user là thành công. Mặc định false vì phần lớn
     * {@code DataIntegrityViolationException} khác trong codebase (vd xóa dòng đang bị FK tham
     * chiếu) là lỗi thật, cần audit như mọi lỗi khác.
     */
    boolean suppressOnDataIntegrityViolation() default false;
}
