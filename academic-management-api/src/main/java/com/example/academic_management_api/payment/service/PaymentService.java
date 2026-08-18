package com.example.academic_management_api.payment.service;

import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.payment.dto.PaymentRequest;
import com.example.academic_management_api.payment.dto.PaymentResponse;
import com.example.academic_management_api.payment.entity.Payments;
import com.example.academic_management_api.payment.repository.PaymentRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentService enrollmentService;

    public PaymentService(
            PaymentRepository paymentRepository,
            CourseRepository courseRepository,
            UserRepository userRepository,
            EnrollmentService enrollmentService
    ) {
        this.paymentRepository = paymentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrollmentService = enrollmentService;
    }

    public ResponseEntity<PaymentResponse> checkout(PaymentRequest request, Integer studentId) {

        Courses course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found"));

        Users student = userRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        boolean enrolled = enrollmentService.isEnrolled(studentId, course.getCourseId());

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

        enrollmentService.createEnrollment(student, course);

        return ResponseEntity.ok(
                new PaymentResponse(true, "Thanh toán thành công")
        );
    }

    public List<Payments> getAllPayments() {
        return paymentRepository.findAll();
    }

    public long getTotalPayments() {
        return paymentRepository.count();
    }
}
