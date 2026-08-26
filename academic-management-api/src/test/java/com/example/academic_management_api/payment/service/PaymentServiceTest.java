package com.example.academic_management_api.payment.service;

import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.payment.dto.PaymentRequest;
import com.example.academic_management_api.payment.dto.PaymentResponse;
import com.example.academic_management_api.payment.entity.PaymentIdempotencyKey;
import com.example.academic_management_api.payment.entity.Payments;
import com.example.academic_management_api.payment.repository.PaymentIdempotencyKeyRepository;
import com.example.academic_management_api.payment.repository.PaymentRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentIdempotencyKeyRepository paymentIdempotencyKeyRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private EnrollmentService enrollmentService;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                paymentIdempotencyKeyRepository,
                courseRepository,
                userRepository,
                enrollmentService
        );
    }

    private Courses course(BigDecimal price) {
        Courses course = new Courses();
        course.setCourseId(1);
        course.setPrice(price);
        return course;
    }

    private Users student() {
        Users student = new Users();
        student.setUserId(10);
        student.setUsername("student1");
        return student;
    }

    @Test
    void checkout_computesAmountFromCoursePrice_neverFromClient() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);

        PaymentRequest request = new PaymentRequest();
        request.setCourseId(1);
        request.setPaymentMethod("VNPAY");

        ResponseEntity<PaymentResponse> response = paymentService.checkout(request, "key-1", "student1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSuccess()).isTrue();

        ArgumentCaptor<Payments> paymentCaptor = ArgumentCaptor.forClass(Payments.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getAmount()).isEqualByComparingTo("500000.00");

        verify(enrollmentService).createEnrollment(student, course);
        verify(paymentIdempotencyKeyRepository).saveAndFlush(any(PaymentIdempotencyKey.class));
    }

    @Test
    void checkout_existingIdempotencyKey_replaysWithoutRecreatingPaymentOrEnrollment() {
        when(paymentIdempotencyKeyRepository.findById("key-1"))
                .thenReturn(Optional.of(new PaymentIdempotencyKey()));

        PaymentRequest request = new PaymentRequest();
        request.setCourseId(1);
        request.setPaymentMethod("VNPAY");

        ResponseEntity<PaymentResponse> response = paymentService.checkout(request, "key-1", "student1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSuccess()).isTrue();

        verifyNoInteractions(courseRepository, userRepository, enrollmentService, paymentRepository);
    }

    @Test
    void checkout_alreadyActivelyEnrolled_returnsBadRequestWithoutCreatingPayment() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(true);

        PaymentRequest request = new PaymentRequest();
        request.setCourseId(1);
        request.setPaymentMethod("VNPAY");

        ResponseEntity<PaymentResponse> response = paymentService.checkout(request, "key-1", "student1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().isSuccess()).isFalse();

        verify(paymentRepository, never()).save(any());
        verify(enrollmentService, never()).createEnrollment(any(), any());
        verify(paymentIdempotencyKeyRepository, never()).saveAndFlush(any());
    }

    @Test
    void resolveCheckoutConflict_keyWasPersisted_replaysSuccessOfTheWinningRequest() {
        // Trường hợp cùng Idempotency-Key được gửi đồng thời (retry/double-click):
        // request thắng race đã lưu xong key này trước khi request hiện tại soi lại.
        when(paymentIdempotencyKeyRepository.findById("key-1"))
                .thenReturn(Optional.of(new PaymentIdempotencyKey()));

        ResponseEntity<PaymentResponse> response = paymentService.resolveCheckoutConflict("key-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSuccess()).isTrue();
    }

    @Test
    void resolveCheckoutConflict_keyNeverPersisted_meansEnrollmentRaceNotOwnKey_returnsAlreadyEnrolled() {
        // Trường hợp 2 request khác Idempotency-Key cùng checkout 1 course đồng thời: request
        // hiện tại thua race ở enrollment unique index (không phải ở idempotency key của chính
        // nó), nên key của nó chưa từng được lưu -> phải trả "đã đăng ký", không phải replay.
        when(paymentIdempotencyKeyRepository.findById("key-2"))
                .thenReturn(Optional.empty());

        ResponseEntity<PaymentResponse> response = paymentService.resolveCheckoutConflict("key-2");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().isSuccess()).isFalse();
    }
}
