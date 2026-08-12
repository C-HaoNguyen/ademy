package com.example.academic_management_api.controller;

import com.example.academic_management_api.dto.PaymentRequest;
import com.example.academic_management_api.dto.PaymentResponse;
import com.example.academic_management_api.entity.Courses;
import com.example.academic_management_api.entity.Enrollments;
import com.example.academic_management_api.entity.Payments;
import com.example.academic_management_api.entity.Users;
import com.example.academic_management_api.repository.CourseRepository;
import com.example.academic_management_api.repository.EnrollmentRepository;
import com.example.academic_management_api.repository.PaymentRepository;
import com.example.academic_management_api.repository.UserRepository;
import com.example.academic_management_api.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public PaymentController(PaymentRepository paymentRepository, CourseRepository courseRepository, EnrollmentRepository enrollmentRepository, UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/checkout")
    public ResponseEntity<PaymentResponse> checkout(@RequestBody PaymentRequest request, @AuthenticationPrincipal CustomUserDetails user) {

        Integer studentId = user.getUserId();

        Courses course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Users student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean enrolled = enrollmentRepository
                .existsByStudent_UserIdAndCourse_CourseId(studentId, course.getCourseId());

        if (enrolled) {
            return ResponseEntity.badRequest().body(
                    new PaymentResponse(false, "Bạn đã đăng ký khóa học này")
            );
        }

        Payments payment = new Payments();
        payment.setStudent(student);
        payment.setCourse(course);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus("SUCCESS");

        paymentRepository.save(payment);

        Enrollments enrollment = new Enrollments();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(LocalDateTime.now());

        enrollmentRepository.save(enrollment);

        return ResponseEntity.ok(
                new PaymentResponse(true, "Thanh toán thành công")
        );
    }
}
