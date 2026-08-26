package com.example.academic_management_api.payment.service;

import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.payment.dto.PaymentRequest;
import com.example.academic_management_api.payment.dto.PaymentResponse;
import com.example.academic_management_api.payment.entity.PaymentIdempotencyKey;
import com.example.academic_management_api.payment.entity.PaymentStatus;
import com.example.academic_management_api.payment.entity.Payments;
import com.example.academic_management_api.payment.repository.PaymentIdempotencyKeyRepository;
import com.example.academic_management_api.payment.repository.PaymentRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentIdempotencyKeyRepository paymentIdempotencyKeyRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentService enrollmentService;

    public PaymentService(
            PaymentRepository paymentRepository,
            PaymentIdempotencyKeyRepository paymentIdempotencyKeyRepository,
            CourseRepository courseRepository,
            UserRepository userRepository,
            EnrollmentService enrollmentService
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentIdempotencyKeyRepository = paymentIdempotencyKeyRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrollmentService = enrollmentService;
    }

    @Transactional
    public ResponseEntity<PaymentResponse> checkout(PaymentRequest request, String idempotencyKey, String username) {

        Optional<PaymentIdempotencyKey> existingKey = paymentIdempotencyKeyRepository.findById(idempotencyKey);
        if (existingKey.isPresent()) {
            return ResponseEntity.ok(
                    new PaymentResponse(true, "Thanh toán thành công")
            );
        }

        Courses course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found"));

        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean enrolled = enrollmentService.isEnrolled(student.getUserId(), course.getCourseId());

        if (enrolled) {
            return ResponseEntity.badRequest().body(
                    new PaymentResponse(false, "Bạn đã đăng ký khóa học này")
            );
        }

        Payments payment = new Payments();
        payment.setStudent(student);
        payment.setCourse(course);
        payment.setAmount(course.getPrice());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus(PaymentStatus.SUCCESS);

        paymentRepository.save(payment);

        enrollmentService.createEnrollment(student, course);

        PaymentIdempotencyKey key = new PaymentIdempotencyKey();
        key.setIdempotencyKey(idempotencyKey);
        key.setStudent(student);
        key.setPayment(payment);

        // saveAndFlush (không phải save) để buộc Hibernate INSERT ngay tại đây thay vì hoãn
        // tới lúc commit — nếu không, vi phạm unique constraint sẽ nổ ra trong pha commit của
        // Spring và bị bọc thành TransactionSystemException thay vì DataIntegrityViolationException,
        // khiến catch ở PaymentController không bắt được. Không bắt exception ngay tại đây: một khi
        // INSERT bị DB từ chối, transaction hiện tại (bao gồm cả payment/enrollment vừa tạo) bắt
        // buộc phải rollback toàn bộ — Postgres không cho tiếp tục dùng transaction đã aborted.
        // Để exception propagate cho @Transactional tự rollback đúng; caller (PaymentController)
        // bắt exception này và gọi resolveCheckoutConflict() ở một transaction mới để xử lý theo
        // đúng loại xung đột đã xảy ra (ADR-007, EC-001).
        paymentIdempotencyKeyRepository.saveAndFlush(key);

        return ResponseEntity.ok(
                new PaymentResponse(true, "Thanh toán thành công")
        );
    }

    // Gọi khi checkout() ném DataIntegrityViolationException. Có 2 nguồn gốc khả dĩ, cần phân
    // biệt để trả đúng response:
    // 1) Cùng Idempotency-Key được gửi đồng thời (retry/double-click) -> request kia đã insert
    //    xong bản ghi idempotency key này -> tìm thấy -> replay đúng kết quả thành công của nó.
    // 2) Idempotency-Key khác nhau nhưng cùng student+course được checkout đồng thời -> request
    //    kia thắng race và chiếm slot enrollment active trước (partial unique index ở V5) ->
    //    idempotency key của request hiện tại (đang gọi hàm này) chưa từng được lưu -> không tìm
    //    thấy -> đây không phải một retry, mà là "đã đăng ký khóa học này" xảy ra ngay trong lúc
    //    request đang xử lý -> trả về đúng response mà isEnrolled() lẽ ra đã trả nếu không có race.
    public ResponseEntity<PaymentResponse> resolveCheckoutConflict(String idempotencyKey) {
        Optional<PaymentIdempotencyKey> existingKey = paymentIdempotencyKeyRepository.findById(idempotencyKey);

        if (existingKey.isPresent()) {
            return ResponseEntity.ok(
                    new PaymentResponse(true, "Thanh toán thành công")
            );
        }

        return ResponseEntity.badRequest().body(
                new PaymentResponse(false, "Bạn đã đăng ký khóa học này")
        );
    }

    public List<Payments> getAllPayments() {
        return paymentRepository.findAllWithDetails();
    }

    public long getTotalPayments() {
        return paymentRepository.count();
    }
}
