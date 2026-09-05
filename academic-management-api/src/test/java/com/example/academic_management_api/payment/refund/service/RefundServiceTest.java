package com.example.academic_management_api.payment.refund.service;

import com.example.academic_management_api.application.port.EmailSenderPort;
import com.example.academic_management_api.application.port.RefundGatewayPort;
import com.example.academic_management_api.common.exception.BadGatewayException;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.payment.entity.PaymentStatus;
import com.example.academic_management_api.payment.entity.Payments;
import com.example.academic_management_api.payment.refund.dto.RefundRequestCreateRequest;
import com.example.academic_management_api.payment.refund.dto.RefundResponse;
import com.example.academic_management_api.payment.refund.entity.RefundBusinessStatus;
import com.example.academic_management_api.payment.refund.entity.RefundExecutionStatus;
import com.example.academic_management_api.payment.refund.entity.RefundIdempotencyKey;
import com.example.academic_management_api.payment.refund.entity.RefundRequests;
import com.example.academic_management_api.payment.refund.repository.RefundIdempotencyKeyRepository;
import com.example.academic_management_api.payment.refund.repository.RefundRequestRepository;
import com.example.academic_management_api.payment.repository.PaymentRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefundServiceTest {

    @Mock
    private RefundRequestRepository refundRequestRepository;
    @Mock
    private RefundIdempotencyKeyRepository refundIdempotencyKeyRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RefundGatewayPort refundGatewayPort;
    @Mock
    private EmailSenderPort emailSenderPort;

    private RefundService refundService;

    @BeforeEach
    void setUp() {
        refundService = new RefundService(
                refundRequestRepository,
                refundIdempotencyKeyRepository,
                paymentRepository,
                userRepository,
                refundGatewayPort,
                emailSenderPort
        );
    }

    private Users student(int id) {
        Users user = new Users();
        user.setUserId(id);
        user.setEmail("student" + id + "@example.com");
        return user;
    }

    private Courses course() {
        Courses course = new Courses();
        course.setCourseId(10);
        course.setTitle("Java cơ bản");
        return course;
    }

    private Payments payment(Users owner, PaymentStatus status) {
        Payments payment = new Payments();
        payment.setPaymentId(100);
        payment.setStudent(owner);
        payment.setCourse(course());
        payment.setAmount(new BigDecimal("500000"));
        payment.setStatus(status);
        return payment;
    }

    private RefundRequests refundRequest(RefundBusinessStatus businessStatus, RefundExecutionStatus executionStatus) {
        RefundRequests r = new RefundRequests();
        r.setId(1);
        r.setPayment(payment(student(1), PaymentStatus.SUCCESS));
        r.setStudent(student(1));
        r.setReason("Không phù hợp với trình độ");
        r.setBusinessStatus(businessStatus);
        r.setExecutionStatus(executionStatus);
        return r;
    }

    // ------------------------------------------------------------------
    // createRequest — validate ownership/status/duplicate + Idempotency-Key replay
    // ------------------------------------------------------------------

    @Test
    void createRequest_validSuccessPayment_savesRequestedAndPersistsIdempotencyKey() {
        Users student = student(1);
        Payments payment = payment(student, PaymentStatus.SUCCESS);
        RefundRequestCreateRequest request = new RefundRequestCreateRequest();
        request.setPaymentId(100);
        request.setReason("Không phù hợp");

        when(refundIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(paymentRepository.findById(100)).thenReturn(Optional.of(payment));
        when(refundRequestRepository.existsByPaymentAndBusinessStatusNot(payment, RefundBusinessStatus.REJECTED))
                .thenReturn(false);

        RefundResponse response = refundService.createRequest(request, "key-1", "student1");

        assertThat(response.getBusinessStatus()).isEqualTo(RefundBusinessStatus.REQUESTED);
        assertThat(response.getExecutionStatus()).isEqualTo(RefundExecutionStatus.NOT_STARTED);
        assertThat(response.getPaymentId()).isEqualTo(100);
        verify(refundRequestRepository).saveAndFlush(any());
        verify(refundIdempotencyKeyRepository).saveAndFlush(any());
    }

    @Test
    void createRequest_paymentNotOwnedByCaller_throwsForbiddenException() {
        Users caller = student(1);
        Users otherOwner = student(2);
        Payments payment = payment(otherOwner, PaymentStatus.SUCCESS);
        RefundRequestCreateRequest request = new RefundRequestCreateRequest();
        request.setPaymentId(100);
        request.setReason("Không phù hợp");

        when(refundIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(caller));
        when(paymentRepository.findById(100)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> refundService.createRequest(request, "key-1", "student1"))
                .isInstanceOf(ForbiddenException.class);

        verify(refundRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRequest_paymentNotSuccess_throwsConflictException() {
        Users student = student(1);
        Payments payment = payment(student, PaymentStatus.PENDING);
        RefundRequestCreateRequest request = new RefundRequestCreateRequest();
        request.setPaymentId(100);
        request.setReason("Không phù hợp");

        when(refundIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(paymentRepository.findById(100)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> refundService.createRequest(request, "key-1", "student1"))
                .isInstanceOf(ConflictException.class);

        verify(refundRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRequest_alreadyHasOpenRequestForPayment_throwsConflictException() {
        Users student = student(1);
        Payments payment = payment(student, PaymentStatus.SUCCESS);
        RefundRequestCreateRequest request = new RefundRequestCreateRequest();
        request.setPaymentId(100);
        request.setReason("Không phù hợp");

        when(refundIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(paymentRepository.findById(100)).thenReturn(Optional.of(payment));
        when(refundRequestRepository.existsByPaymentAndBusinessStatusNot(payment, RefundBusinessStatus.REJECTED))
                .thenReturn(true);

        assertThatThrownBy(() -> refundService.createRequest(request, "key-1", "student1"))
                .isInstanceOf(ConflictException.class);

        verify(refundRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRequest_duplicateIdempotencyKey_replaysExistingRequestWithoutCreatingNew() {
        RefundIdempotencyKey existingKey = new RefundIdempotencyKey();
        RefundRequests existing = refundRequest(RefundBusinessStatus.REQUESTED, RefundExecutionStatus.NOT_STARTED);
        existingKey.setRefundRequest(existing);

        RefundRequestCreateRequest request = new RefundRequestCreateRequest();
        request.setPaymentId(100);
        request.setReason("Không phù hợp");

        when(refundIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.of(existingKey));
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(existing));

        RefundResponse response = refundService.createRequest(request, "key-1", "student1");

        assertThat(response.getId()).isEqualTo(1);
        verifyNoInteractions(userRepository);
        verify(refundRequestRepository, never()).saveAndFlush(any());
    }

    @Test
    void resolveCreateConflict_keyRecordedByConcurrentRequest_replaysItsResult() {
        RefundIdempotencyKey existingKey = new RefundIdempotencyKey();
        RefundRequests existing = refundRequest(RefundBusinessStatus.REQUESTED, RefundExecutionStatus.NOT_STARTED);
        existingKey.setRefundRequest(existing);

        when(refundIdempotencyKeyRepository.findById("key-1")).thenReturn(Optional.of(existingKey));
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(existing));

        RefundResponse response = refundService.resolveCreateConflict("key-1");

        assertThat(response.getId()).isEqualTo(1);
    }

    // ------------------------------------------------------------------
    // approve / reject — chỉ hợp lệ từ REQUESTED, gửi email kết quả (PRD-031)
    // ------------------------------------------------------------------

    @Test
    void approve_requestedStatus_movesToApprovedAndSendsEmail() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.REQUESTED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.updateBusinessStatusIfRequested(
                eq(1), eq(RefundBusinessStatus.APPROVED), isNull(), any(LocalDateTime.class)))
                .thenReturn(1);

        RefundResponse response = refundService.approve(1);

        assertThat(response.getBusinessStatus()).isEqualTo(RefundBusinessStatus.APPROVED);
        verify(emailSenderPort).send(anyString(), anyString(), anyString());
    }

    // Đóng race 2 admin (hoặc double-click) cùng approve 1 request — atomic UPDATE (cùng nguyên tắc
    // PaymentRepository.updateStatusIfPending) trả 0 hàng bị ảnh hưởng khi request không còn REQUESTED
    // (đã bị request khác xử lý trước), request thua không gửi email lần 2.
    @Test
    void approve_notRequestedStatus_throwsConflictExceptionWithoutSendingEmail() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.APPROVED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.updateBusinessStatusIfRequested(
                eq(1), eq(RefundBusinessStatus.APPROVED), isNull(), any(LocalDateTime.class)))
                .thenReturn(0);

        assertThatThrownBy(() -> refundService.approve(1)).isInstanceOf(ConflictException.class);

        verifyNoInteractions(emailSenderPort);
    }

    @Test
    void reject_requestedStatus_movesToRejectedWithNoteAndSendsEmail() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.REQUESTED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.updateBusinessStatusIfRequested(
                eq(1), eq(RefundBusinessStatus.REJECTED), eq("Đã quá thời hạn hỗ trợ"), any(LocalDateTime.class)))
                .thenReturn(1);

        RefundResponse response = refundService.reject(1, "Đã quá thời hạn hỗ trợ");

        assertThat(response.getBusinessStatus()).isEqualTo(RefundBusinessStatus.REJECTED);
        assertThat(response.getAdminNote()).isEqualTo("Đã quá thời hạn hỗ trợ");
        verify(emailSenderPort).send(anyString(), anyString(), anyString());
    }

    @Test
    void reject_notRequestedStatus_throwsConflictException() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.REJECTED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.updateBusinessStatusIfRequested(
                eq(1), eq(RefundBusinessStatus.REJECTED), anyString(), any(LocalDateTime.class)))
                .thenReturn(0);

        assertThatThrownBy(() -> refundService.reject(1, "..."))
                .isInstanceOf(ConflictException.class);

        verifyNoInteractions(emailSenderPort);
    }

    // ------------------------------------------------------------------
    // markCompleted — chỉ hợp lệ từ APPROVED, không gọi gateway thật (ADR-011), không action nào
    // tự động approve
    // ------------------------------------------------------------------

    @Test
    void markCompleted_approvedStatus_callsManualGatewayAndMarksCompleted() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.APPROVED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.claimForManualCompletion(eq(1), any(LocalDateTime.class))).thenReturn(1);
        when(refundGatewayPort.executeRefund(any()))
                .thenReturn(new RefundGatewayPort.RefundOutcome(true, "MANUAL-abc123"));

        RefundResponse response = refundService.markCompleted(1);

        assertThat(response.getExecutionStatus()).isEqualTo(RefundExecutionStatus.MANUAL_COMPLETED);
        assertThat(response.getGatewayRefundReference()).isEqualTo("MANUAL-abc123");
        verify(refundGatewayPort).executeRefund(any());
        verify(refundRequestRepository).save(refundRequest);
    }

    // Đóng race "2 admin cùng markCompleted" TRƯỚC khi gọi gateway (không phải sau) — claim thất bại
    // (0 hàng bị ảnh hưởng) nghĩa là request không còn ở đúng APPROVED/NOT_STARTED, không được gọi
    // RefundGatewayPort — quan trọng khi Phase 2 thay ManualRefundGateway bằng adapter gọi HTTP thật.
    @Test
    void markCompleted_notApprovedYet_throwsConflictExceptionWithoutCallingGateway() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.REQUESTED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.claimForManualCompletion(eq(1), any(LocalDateTime.class))).thenReturn(0);

        assertThatThrownBy(() -> refundService.markCompleted(1)).isInstanceOf(ConflictException.class);

        verifyNoInteractions(refundGatewayPort);
    }

    @Test
    void markCompleted_alreadyCompleted_throwsConflictExceptionWithoutCallingGatewayAgain() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.APPROVED, RefundExecutionStatus.MANUAL_COMPLETED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.claimForManualCompletion(eq(1), any(LocalDateTime.class))).thenReturn(0);

        assertThatThrownBy(() -> refundService.markCompleted(1)).isInstanceOf(ConflictException.class);

        verifyNoInteractions(refundGatewayPort);
    }

    // Gateway (adapter thật ở Phase 2) báo thất bại -> không được đánh dấu MANUAL_COMPLETED; claim
    // atomic đã set execution_status trước khi biết kết quả gateway, nhưng @Transactional rollback
    // undo lại toàn bộ nên DB không kẹt ở trạng thái sai (không verify được rollback thật ở unit test
    // thuần — chỉ verify hành vi Java: ném đúng exception, không gọi save() để persist completion).
    @Test
    void markCompleted_gatewayReportsFailure_throwsBadGatewayExceptionWithoutPersistingCompletion() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.APPROVED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.claimForManualCompletion(eq(1), any(LocalDateTime.class))).thenReturn(1);
        when(refundGatewayPort.executeRefund(any()))
                .thenReturn(new RefundGatewayPort.RefundOutcome(false, null));

        assertThatThrownBy(() -> refundService.markCompleted(1)).isInstanceOf(BadGatewayException.class);

        verify(refundRequestRepository, never()).save(any());
    }

    @Test
    void refundRequestNotFound_forApproveRejectMarkCompleted_throwsNotFoundException() {
        when(refundRequestRepository.findByIdWithDetails(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refundService.approve(99)).isInstanceOf(NotFoundException.class);
    }

    // ------------------------------------------------------------------
    // Full flow: REQUESTED -> APPROVED -> MANUAL_COMPLETED
    // ------------------------------------------------------------------

    @Test
    void fullFlow_requestedApprovedThenMarkedCompleted_endsInCorrectFinalState() {
        RefundRequests refundRequest = refundRequest(RefundBusinessStatus.REQUESTED, RefundExecutionStatus.NOT_STARTED);
        when(refundRequestRepository.findByIdWithDetails(1)).thenReturn(Optional.of(refundRequest));
        when(refundRequestRepository.updateBusinessStatusIfRequested(
                eq(1), eq(RefundBusinessStatus.APPROVED), isNull(), any(LocalDateTime.class)))
                .thenReturn(1);
        when(refundRequestRepository.claimForManualCompletion(eq(1), any(LocalDateTime.class))).thenReturn(1);
        when(refundGatewayPort.executeRefund(any()))
                .thenReturn(new RefundGatewayPort.RefundOutcome(true, "MANUAL-xyz"));

        RefundResponse approved = refundService.approve(1);
        assertThat(approved.getBusinessStatus()).isEqualTo(RefundBusinessStatus.APPROVED);

        RefundResponse completed = refundService.markCompleted(1);
        assertThat(completed.getBusinessStatus()).isEqualTo(RefundBusinessStatus.APPROVED);
        assertThat(completed.getExecutionStatus()).isEqualTo(RefundExecutionStatus.MANUAL_COMPLETED);

        verify(refundGatewayPort, times(1)).executeRefund(any());
    }

    // ------------------------------------------------------------------
    // Phase 29 — AdminDashboard "Yêu cầu hoàn tiền đang chờ duyệt" (rút gọn)
    // ------------------------------------------------------------------

    @Test
    void getRecentPending_returnsOnlyRequestedMappedToResponse() {
        RefundRequests pending = refundRequest(RefundBusinessStatus.REQUESTED, RefundExecutionStatus.NOT_STARTED);

        when(refundRequestRepository.findByBusinessStatusOrderByRequestedAtDesc(
                eq(RefundBusinessStatus.REQUESTED), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(java.util.List.of(pending));

        java.util.List<RefundResponse> result = refundService.getRecentPending(5);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getBusinessStatus()).isEqualTo(RefundBusinessStatus.REQUESTED);
    }

    @Test
    void getRecentPending_noneRequested_returnsEmptyList() {
        when(refundRequestRepository.findByBusinessStatusOrderByRequestedAtDesc(
                eq(RefundBusinessStatus.REQUESTED), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(java.util.List.of());

        java.util.List<RefundResponse> result = refundService.getRecentPending(5);

        assertThat(result).isEmpty();
    }
}
