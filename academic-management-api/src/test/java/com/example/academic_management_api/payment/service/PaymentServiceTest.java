package com.example.academic_management_api.payment.service;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.payment.coupon.entity.CouponDiscountType;
import com.example.academic_management_api.payment.coupon.entity.Coupons;
import com.example.academic_management_api.payment.coupon.service.CouponService;
import com.example.academic_management_api.payment.dto.CouponPreviewResponse;
import com.example.academic_management_api.payment.dto.PaymentRequest;
import com.example.academic_management_api.payment.dto.PaymentResponse;
import com.example.academic_management_api.payment.entity.PaymentIdempotencyKey;
import com.example.academic_management_api.payment.entity.PaymentMethod;
import com.example.academic_management_api.payment.entity.PaymentStatus;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    @Mock
    private CouponService couponService;
    @Mock
    private PaymentGatewayPort vnPayGateway;

    private PaymentService mockModeService;
    private PaymentService liveModeService;

    @BeforeEach
    void setUp() {
        mockModeService = new PaymentService(
                paymentRepository,
                paymentIdempotencyKeyRepository,
                courseRepository,
                userRepository,
                enrollmentService,
                couponService,
                List.of(),
                "mock"
        );
        // gatewayId() phải được stub TRƯỚC khi tạo PaymentService — constructor build map ngay lúc
        // khởi tạo (đọc gatewayId() 1 lần), stub sau đó sẽ không còn tác dụng lên map đã build.
        lenient().when(vnPayGateway.gatewayId()).thenReturn("vnpay");
        liveModeService = new PaymentService(
                paymentRepository,
                paymentIdempotencyKeyRepository,
                courseRepository,
                userRepository,
                enrollmentService,
                couponService,
                List.of(vnPayGateway),
                "live"
        );
    }

    private Coupons percentageCoupon(BigDecimal percent, Integer maxRedemptions, int redemptionCount) {
        Coupons coupon = new Coupons();
        coupon.setId(1);
        coupon.setCode("SALE10");
        coupon.setDiscountType(CouponDiscountType.PERCENTAGE);
        coupon.setDiscountValue(percent);
        coupon.setMaxRedemptions(maxRedemptions);
        coupon.setRedemptionCount(redemptionCount);
        coupon.setActive(true);
        return coupon;
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

    private PaymentRequest request() {
        PaymentRequest request = new PaymentRequest();
        request.setCourseId(1);
        request.setPaymentMethod(PaymentMethod.VNPAY);
        return request;
    }

    @Test
    void isLiveMode_reflectsConfiguredPaymentMode() {
        assertThat(mockModeService.isLiveMode()).isFalse();
        assertThat(liveModeService.isLiveMode()).isTrue();
    }

    // ------------------------------------------------------------------
    // Mock mode (Phase 19 — không đổi hành vi)
    // ------------------------------------------------------------------

    @Test
    void checkout_computesAmountFromCoursePrice_neverFromClient() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);

        ResponseEntity<PaymentResponse> response = mockModeService.checkout(request(), "key-1", "student1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSuccess()).isTrue();

        ArgumentCaptor<Payments> paymentCaptor = ArgumentCaptor.forClass(Payments.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getAmount()).isEqualByComparingTo("500000.00");
        assertThat(paymentCaptor.getValue().getStatus()).isEqualTo(PaymentStatus.SUCCESS);

        verify(enrollmentService).createEnrollment(student, course);
        verify(paymentIdempotencyKeyRepository).saveAndFlush(any(PaymentIdempotencyKey.class));
    }

    @Test
    void checkout_existingIdempotencyKey_replaysWithoutRecreatingPaymentOrEnrollment() {
        when(paymentIdempotencyKeyRepository.findById("key-1"))
                .thenReturn(Optional.of(new PaymentIdempotencyKey()));

        ResponseEntity<PaymentResponse> response = mockModeService.checkout(request(), "key-1", "student1");

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

        ResponseEntity<PaymentResponse> response = mockModeService.checkout(request(), "key-1", "student1");

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

        ResponseEntity<PaymentResponse> response = mockModeService.resolveCheckoutConflict("key-1");

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

        ResponseEntity<PaymentResponse> response = mockModeService.resolveCheckoutConflict("key-2");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().isSuccess()).isFalse();
    }

    // ------------------------------------------------------------------
    // Live mode (Phase 21)
    // ------------------------------------------------------------------

    @Test
    void createPendingPayment_newCheckout_createsPendingPaymentWithoutEnrollingYet() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);

        PaymentService.LiveCheckoutInit init = liveModeService.createPendingPayment(request(), "key-1", "student1");

        assertThat(init.shortCircuit()).isNull();
        assertThat(init.payment()).isNotNull();
        assertThat(init.payment().getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(init.payment().getAmount()).isEqualByComparingTo("500000.00");

        verify(enrollmentService, never()).createEnrollment(any(), any());
        verify(paymentIdempotencyKeyRepository).saveAndFlush(any(PaymentIdempotencyKey.class));
    }

    @Test
    void createPendingPayment_withValidCoupon_discountsAmountButDoesNotConsumeRedemptionYet() {
        // Best practice: coupon chỉ được "đốt" (increment redemption_count) khi gateway xác nhận
        // SUCCESS thật ở processCallback(), không phải lúc tạo PENDING — 1 giao dịch PENDING bị
        // fail/bỏ ngang không được phép khóa vĩnh viễn 1 coupon maxRedemptions thấp.
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();
        Coupons coupon = percentageCoupon(new BigDecimal("10"), 1, 0);

        PaymentRequest request = request();
        request.setCouponCode("SALE10");

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);
        when(couponService.resolveValidCoupon("SALE10", 1)).thenReturn(coupon);

        PaymentService.LiveCheckoutInit init = liveModeService.createPendingPayment(request, "key-1", "student1");

        assertThat(init.payment().getAmount()).isEqualByComparingTo("450000.00");
        assertThat(init.payment().getCoupon()).isEqualTo(coupon);
        verify(couponService, never()).consumeRedemption(any(), any(), any());
    }

    @Test
    void createPendingPayment_alreadyActivelyEnrolled_shortCircuitsWithoutCreatingPayment() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(true);

        PaymentService.LiveCheckoutInit init = liveModeService.createPendingPayment(request(), "key-1", "student1");

        assertThat(init.shortCircuit()).isNotNull();
        assertThat(init.shortCircuit().getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void createPendingPayment_existingKeyStillPending_replaysPendingMessage() {
        Payments pendingPayment = new Payments();
        pendingPayment.setStatus(PaymentStatus.PENDING);
        PaymentIdempotencyKey existing = new PaymentIdempotencyKey();
        existing.setPayment(pendingPayment);

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.of(existing));

        PaymentService.LiveCheckoutInit init = liveModeService.createPendingPayment(request(), "key-1", "student1");

        assertThat(init.payment()).isNull();
        assertThat(init.shortCircuit().getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(init.shortCircuit().getBody().isSuccess()).isTrue();
        verifyNoInteractions(courseRepository, userRepository, enrollmentService);
    }

    @Test
    void initiateGatewaySession_callsResolvedGateway_savesReferenceAndReturnsRedirectUrl() {
        Courses course = course(new BigDecimal("500000.00"));
        Payments payment = new Payments();
        payment.setCourse(course);
        payment.setAmount(new BigDecimal("500000.00"));
        payment.setPaymentMethod("VNPAY");

        when(vnPayGateway.createCheckoutSession(any())).thenReturn(
                new PaymentGatewayPort.CheckoutSession("https://sandbox.vnpayment.vn/pay?...", "key-1"));

        ResponseEntity<PaymentResponse> response = liveModeService.initiateGatewaySession(payment, "key-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getRedirectUrl()).isEqualTo("https://sandbox.vnpayment.vn/pay?...");
        assertThat(payment.getGatewayTransactionRef()).isEqualTo("key-1");
        verify(paymentRepository).save(payment);
    }

    @Test
    void processCallback_invalidSignature_doesNotTouchDatabase() {
        PaymentCallbackOutcome outcome = liveModeService.processCallback(
                new PaymentGatewayPort.CallbackResult(false, "key-1", true));

        assertThat(outcome).isEqualTo(PaymentCallbackOutcome.INVALID_SIGNATURE);
        verifyNoInteractions(paymentRepository, enrollmentService);
    }

    @Test
    void processCallback_successfulCallback_transitionsPendingToSuccessAndCreatesEnrollment() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();
        Payments payment = new Payments();
        payment.setPaymentId(99);
        payment.setStudent(student);
        payment.setCourse(course);

        when(paymentRepository.findByGatewayTransactionRef("key-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfPending(99, PaymentStatus.SUCCESS)).thenReturn(1);

        PaymentCallbackOutcome outcome = liveModeService.processCallback(
                new PaymentGatewayPort.CallbackResult(true, "key-1", true));

        assertThat(outcome).isEqualTo(PaymentCallbackOutcome.PROCESSED);
        verify(enrollmentService).createEnrollment(student, course);
    }

    @Test
    void processCallback_failedCallback_transitionsToFailedWithoutCreatingEnrollment() {
        Payments payment = new Payments();
        payment.setPaymentId(99);

        when(paymentRepository.findByGatewayTransactionRef("key-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfPending(99, PaymentStatus.FAILED)).thenReturn(1);

        PaymentCallbackOutcome outcome = liveModeService.processCallback(
                new PaymentGatewayPort.CallbackResult(true, "key-1", false));

        assertThat(outcome).isEqualTo(PaymentCallbackOutcome.PROCESSED);
        verify(enrollmentService, never()).createEnrollment(any(), any());
    }

    @Test
    void processCallback_successfulCallbackWithoutCoupon_doesNotTouchCouponService() {
        Payments payment = new Payments();
        payment.setPaymentId(99);
        payment.setStudent(student());
        payment.setCourse(course(new BigDecimal("500000.00")));

        when(paymentRepository.findByGatewayTransactionRef("key-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfPending(99, PaymentStatus.SUCCESS)).thenReturn(1);

        liveModeService.processCallback(new PaymentGatewayPort.CallbackResult(true, "key-1", true));

        verifyNoInteractions(couponService);
    }

    @Test
    void processCallback_successfulCallbackWithCoupon_consumesRedemptionWithLockedInDiscount() {
        Courses course = course(new BigDecimal("500000.00"));
        Coupons coupon = percentageCoupon(new BigDecimal("10"), 1, 0);
        Payments payment = new Payments();
        payment.setPaymentId(99);
        payment.setStudent(student());
        payment.setCourse(course);
        payment.setAmount(new BigDecimal("450000.00"));
        payment.setCoupon(coupon);

        when(paymentRepository.findByGatewayTransactionRef("key-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfPending(99, PaymentStatus.SUCCESS)).thenReturn(1);

        liveModeService.processCallback(new PaymentGatewayPort.CallbackResult(true, "key-1", true));

        verify(couponService).consumeRedemption(coupon, payment, new BigDecimal("50000.00"));
    }

    @Test
    void processCallback_failedCallbackWithCoupon_doesNotConsumeRedemption() {
        Coupons coupon = percentageCoupon(new BigDecimal("10"), 1, 0);
        Payments payment = new Payments();
        payment.setPaymentId(99);
        payment.setCoupon(coupon);

        when(paymentRepository.findByGatewayTransactionRef("key-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfPending(99, PaymentStatus.FAILED)).thenReturn(1);

        liveModeService.processCallback(new PaymentGatewayPort.CallbackResult(true, "key-1", false));

        verifyNoInteractions(couponService);
    }

    @Test
    void processCallback_successfulCallbackCouponConsumeFails_stillCompletesEnrollment() {
        // Gateway đã xác nhận tiền thật -> không được rollback enrollment/payment SUCCESS chỉ vì
        // coupon vừa bị deactivate/hết lượt trong lúc chờ callback (race hiếm) -> consumeRedemption
        // trả false nhưng KHÔNG được throw.
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();
        Coupons coupon = percentageCoupon(new BigDecimal("10"), 1, 1);
        Payments payment = new Payments();
        payment.setPaymentId(99);
        payment.setStudent(student);
        payment.setCourse(course);
        payment.setAmount(new BigDecimal("450000.00"));
        payment.setCoupon(coupon);

        when(paymentRepository.findByGatewayTransactionRef("key-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfPending(99, PaymentStatus.SUCCESS)).thenReturn(1);
        when(couponService.consumeRedemption(eq(coupon), eq(payment), any(BigDecimal.class))).thenReturn(false);

        PaymentCallbackOutcome outcome = liveModeService.processCallback(
                new PaymentGatewayPort.CallbackResult(true, "key-1", true));

        assertThat(outcome).isEqualTo(PaymentCallbackOutcome.PROCESSED);
        verify(enrollmentService).createEnrollment(student, course);
    }

    @Test
    void processCallback_alreadyProcessed_duplicateOrLateWebhook_doesNotCreateEnrollmentAgain() {
        Payments payment = new Payments();
        payment.setPaymentId(99);

        when(paymentRepository.findByGatewayTransactionRef("key-1")).thenReturn(Optional.of(payment));
        when(paymentRepository.updateStatusIfPending(99, PaymentStatus.SUCCESS)).thenReturn(0);

        PaymentCallbackOutcome outcome = liveModeService.processCallback(
                new PaymentGatewayPort.CallbackResult(true, "key-1", true));

        assertThat(outcome).isEqualTo(PaymentCallbackOutcome.ALREADY_PROCESSED);
        verify(enrollmentService, never()).createEnrollment(any(), any());
    }

    @Test
    void processCallback_transactionRefNotFound_returnsNotFound() {
        when(paymentRepository.findByGatewayTransactionRef("unknown")).thenReturn(Optional.empty());

        PaymentCallbackOutcome outcome = liveModeService.processCallback(
                new PaymentGatewayPort.CallbackResult(true, "unknown", true));

        assertThat(outcome).isEqualTo(PaymentCallbackOutcome.NOT_FOUND);
    }

    @Test
    void processCallback_validSignatureNoTransactionRef_isIgnored() {
        PaymentCallbackOutcome outcome = liveModeService.processCallback(
                new PaymentGatewayPort.CallbackResult(true, null, false));

        assertThat(outcome).isEqualTo(PaymentCallbackOutcome.IGNORED);
        verifyNoInteractions(paymentRepository, enrollmentService);
    }

    // ------------------------------------------------------------------
    // Coupon (Phase 22)
    // ------------------------------------------------------------------

    @Test
    void checkout_withValidPercentageCoupon_discountsAmountAndConsumesRedemption() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();
        Coupons coupon = percentageCoupon(new BigDecimal("10"), null, 0);

        PaymentRequest request = request();
        request.setCouponCode("SALE10");

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);
        when(couponService.resolveValidCoupon("SALE10", 1)).thenReturn(coupon);
        when(couponService.consumeRedemption(eq(coupon), any(Payments.class), eq(new BigDecimal("50000.00"))))
                .thenReturn(true);

        ResponseEntity<PaymentResponse> response = mockModeService.checkout(request, "key-1", "student1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSuccess()).isTrue();

        ArgumentCaptor<Payments> paymentCaptor = ArgumentCaptor.forClass(Payments.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getAmount()).isEqualByComparingTo("450000.00");
        assertThat(paymentCaptor.getValue().getCoupon()).isEqualTo(coupon);

        verify(couponService).consumeRedemption(eq(coupon), any(Payments.class), eq(new BigDecimal("50000.00")));
        verify(enrollmentService).createEnrollment(student, course);
    }

    @Test
    void checkout_withoutCouponCode_behavesExactlyAsBeforePhase22() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);

        mockModeService.checkout(request(), "key-1", "student1");

        verifyNoInteractions(couponService);
    }

    @Test
    void checkout_couponExpiredOrInvalid_propagatesConflictWithoutCreatingPayment() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();

        PaymentRequest request = request();
        request.setCouponCode("EXPIRED");

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);
        when(couponService.resolveValidCoupon("EXPIRED", 1))
                .thenThrow(new ConflictException("Mã coupon đã hết hạn"));

        assertThatThrownBy(() -> mockModeService.checkout(request, "key-1", "student1"))
                .isInstanceOf(ConflictException.class);

        verify(paymentRepository, never()).save(any());
        verify(enrollmentService, never()).createEnrollment(any(), any());
    }

    @Test
    void checkout_couponExhaustedByRaceRightAfterPaymentSaved_rollsBackViaConflictException() {
        Courses course = course(new BigDecimal("500000.00"));
        Users student = student();
        Coupons coupon = percentageCoupon(new BigDecimal("10"), 1, 0);

        PaymentRequest request = request();
        request.setCouponCode("SALE10");

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);
        when(couponService.resolveValidCoupon("SALE10", 1)).thenReturn(coupon);
        when(couponService.consumeRedemption(eq(coupon), any(Payments.class), any(BigDecimal.class)))
                .thenReturn(false);

        assertThatThrownBy(() -> mockModeService.checkout(request, "key-1", "student1"))
                .isInstanceOf(ConflictException.class);

        // Payment đã được save() gọi (test hành vi thật của Postgres @Transactional rollback không
        // verify được ở unit test này — chỉ verify enrollment/idempotency-key KHÔNG được tạo sau đó,
        // đúng thứ tự gọi trong PaymentService.checkout()).
        verify(enrollmentService, never()).createEnrollment(any(), any());
        verify(paymentIdempotencyKeyRepository, never()).saveAndFlush(any());
    }

    @Test
    void checkout_fixedDiscountLargerThanPrice_clampsAmountToZero() {
        Courses course = course(new BigDecimal("50000.00"));
        Users student = student();
        Coupons coupon = new Coupons();
        coupon.setId(2);
        coupon.setCode("BIGFIXED");
        coupon.setDiscountType(CouponDiscountType.FIXED);
        coupon.setDiscountValue(new BigDecimal("100000.00"));
        coupon.setActive(true);

        PaymentRequest request = request();
        request.setCouponCode("BIGFIXED");

        when(paymentIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);
        when(couponService.resolveValidCoupon("BIGFIXED", 1)).thenReturn(coupon);
        when(couponService.consumeRedemption(eq(coupon), any(Payments.class), eq(new BigDecimal("50000.00"))))
                .thenReturn(true);

        mockModeService.checkout(request, "key-1", "student1");

        ArgumentCaptor<Payments> paymentCaptor = ArgumentCaptor.forClass(Payments.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertThat(paymentCaptor.getValue().getAmount()).isEqualByComparingTo("0.00");
    }

    @Test
    void previewCoupon_validCoupon_returnsDiscountWithoutPersistingAnything() {
        Courses course = course(new BigDecimal("500000.00"));
        Coupons coupon = percentageCoupon(new BigDecimal("20"), null, 0);

        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(couponService.resolveValidCoupon("SALE20", 1)).thenReturn(coupon);

        CouponPreviewResponse preview = mockModeService.previewCoupon("SALE20", 1);

        assertThat(preview.getDiscountAmount()).isEqualByComparingTo("100000.00");
        assertThat(preview.getFinalAmount()).isEqualByComparingTo("400000.00");

        verifyNoInteractions(paymentRepository, enrollmentService, paymentIdempotencyKeyRepository);
        verify(couponService, never()).consumeRedemption(any(), any(), any());
    }

    @Test
    void previewCoupon_courseNotFound_throwsNotFoundException() {
        when(courseRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mockModeService.previewCoupon("SALE20", 99))
                .isInstanceOf(NotFoundException.class);
    }
}
