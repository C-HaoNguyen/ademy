package com.example.academic_management_api.payment.refund.service;

import com.example.academic_management_api.application.port.EmailSenderPort;
import com.example.academic_management_api.application.port.RefundGatewayPort;
import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.common.exception.BadGatewayException;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RefundService {

    private final RefundRequestRepository refundRequestRepository;
    private final RefundIdempotencyKeyRepository refundIdempotencyKeyRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final RefundGatewayPort refundGatewayPort;
    private final EmailSenderPort emailSenderPort;

    public RefundService(
            RefundRequestRepository refundRequestRepository,
            RefundIdempotencyKeyRepository refundIdempotencyKeyRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository,
            RefundGatewayPort refundGatewayPort,
            EmailSenderPort emailSenderPort
    ) {
        this.refundRequestRepository = refundRequestRepository;
        this.refundIdempotencyKeyRepository = refundIdempotencyKeyRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.refundGatewayPort = refundGatewayPort;
        this.emailSenderPort = emailSenderPort;
    }

    // ---------------------------------------------------------------------
    // Student — tạo yêu cầu hoàn tiền (PRD-025). Idempotency-Key dedup theo cùng cơ chế ADR-007
    // (client sinh UUID, server lưu bảng dedup riêng, replay kết quả request đầu tiên nếu trùng
    // key) — bảng riêng refund_idempotency_keys, không tái dùng payment_idempotency_keys.
    // ---------------------------------------------------------------------

    // suppressOnDataIntegrityViolation: DataIntegrityViolationException từ saveAndFlush() ở dưới là
    // race condition dự kiến (2 request đồng thời cùng payment/idempotency-key) — controller bắt
    // và gọi resolveCreateConflict() ở transaction mới để trả kết quả cuối cùng, method đó tự audit
    // kết quả thật. Không log "thất bại" giả ở đây cho 1 request thực ra đã thành công.
    @Audited(
            action = "REFUND_REQUEST_CREATE",
            targetType = "REFUND_REQUEST",
            targetIdExpression = "#result.id",
            suppressOnDataIntegrityViolation = true
    )
    @Transactional
    public RefundResponse createRequest(RefundRequestCreateRequest request, String idempotencyKey, String username) {
        Optional<RefundIdempotencyKey> existingKey = refundIdempotencyKeyRepository.findById(idempotencyKey);
        if (existingKey.isPresent()) {
            return toResponse(loadWithDetails(existingKey.get().getRefundRequest().getId()));
        }

        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Payments payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giao dịch thanh toán"));

        if (!payment.getStudent().getUserId().equals(student.getUserId())) {
            throw new ForbiddenException("Bạn không có quyền yêu cầu hoàn tiền cho giao dịch này");
        }
        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new ConflictException("Chỉ có thể yêu cầu hoàn tiền cho giao dịch đã thanh toán thành công");
        }
        if (refundRequestRepository.existsByPaymentAndBusinessStatusNot(payment, RefundBusinessStatus.REJECTED)) {
            throw new ConflictException("Giao dịch này đã có yêu cầu hoàn tiền đang xử lý");
        }

        RefundRequests refundRequest = new RefundRequests();
        refundRequest.setPayment(payment);
        refundRequest.setStudent(student);
        refundRequest.setReason(request.getReason());
        refundRequest.setBusinessStatus(RefundBusinessStatus.REQUESTED);
        refundRequest.setExecutionStatus(RefundExecutionStatus.NOT_STARTED);

        // saveAndFlush (không phải save) — buộc INSERT ngay tại đây thay vì hoãn tới lúc commit, để
        // vi phạm refund_requests_active_payment_uq (2 request đồng thời cùng payment, race mà
        // existsByPaymentAndBusinessStatusNot() phía trên không đóng được) nổ ra thành
        // DataIntegrityViolationException bắt được ở controller, thay vì TransactionSystemException
        // lúc commit. Cùng nguyên tắc persistIdempotencyKey() bên dưới/PaymentService (Phase 19).
        refundRequestRepository.saveAndFlush(refundRequest);

        persistIdempotencyKey(idempotencyKey, student, refundRequest);

        return toResponse(refundRequest);
    }

    // Gọi khi createRequest() ném DataIntegrityViolationException — 1 request khác cùng
    // Idempotency-Key đã thắng race và commit trước (double-click/network retry, EC-001 cùng
    // nguyên tắc PaymentService.resolveCheckoutConflict). Gọi ở transaction mới vì transaction cũ
    // đã bị DB đánh dấu aborted.
    @Audited(action = "REFUND_REQUEST_CREATE", targetType = "REFUND_REQUEST", targetIdExpression = "#result.id")
    public RefundResponse resolveCreateConflict(String idempotencyKey) {
        RefundIdempotencyKey existingKey = refundIdempotencyKeyRepository.findById(idempotencyKey)
                .orElseThrow(() -> new ConflictException("Yêu cầu hoàn tiền đang được xử lý, vui lòng thử lại"));

        return toResponse(loadWithDetails(existingKey.getRefundRequest().getId()));
    }

    // ---------------------------------------------------------------------
    // Admin — duyệt/từ chối/đánh dấu hoàn tất thủ công (PRD-026, ADR-010, ADR-011).
    // ---------------------------------------------------------------------

    public List<RefundResponse> getAll() {
        return refundRequestRepository.findAllWithDetails().stream().map(this::toResponse).toList();
    }

    // Phase 29 — AdminDashboard danh sách rút gọn "Yêu cầu hoàn tiền đang chờ duyệt".
    public List<RefundResponse> getRecentPending(int limit) {
        return refundRequestRepository
                .findByBusinessStatusOrderByRequestedAtDesc(RefundBusinessStatus.REQUESTED, PageRequest.of(0, limit))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Audited(action = "REFUND_APPROVE", targetType = "REFUND_REQUEST", targetIdExpression = "#id")
    @Transactional
    public RefundResponse approve(Integer id) {
        RefundRequests refundRequest = loadWithDetails(id);
        LocalDateTime decidedAt = LocalDateTime.now();

        int updated = refundRequestRepository.updateBusinessStatusIfRequested(
                id, RefundBusinessStatus.APPROVED, null, decidedAt);
        if (updated == 0) {
            throw new ConflictException("Yêu cầu hoàn tiền không ở trạng thái đang chờ duyệt");
        }

        // updateBusinessStatusIfRequested() là bulk JPQL UPDATE — Hibernate không tự đồng bộ lại
        // entity đã load trước đó trong persistence context, phải tự set để dùng cho email/response.
        refundRequest.setBusinessStatus(RefundBusinessStatus.APPROVED);
        refundRequest.setDecidedAt(decidedAt);

        sendDecisionEmail(refundRequest, true);

        return toResponse(refundRequest);
    }

    @Audited(action = "REFUND_REJECT", targetType = "REFUND_REQUEST", targetIdExpression = "#id")
    @Transactional
    public RefundResponse reject(Integer id, String adminNote) {
        RefundRequests refundRequest = loadWithDetails(id);
        LocalDateTime decidedAt = LocalDateTime.now();

        int updated = refundRequestRepository.updateBusinessStatusIfRequested(
                id, RefundBusinessStatus.REJECTED, adminNote, decidedAt);
        if (updated == 0) {
            throw new ConflictException("Yêu cầu hoàn tiền không ở trạng thái đang chờ duyệt");
        }

        refundRequest.setBusinessStatus(RefundBusinessStatus.REJECTED);
        refundRequest.setAdminNote(adminNote);
        refundRequest.setDecidedAt(decidedAt);

        sendDecisionEmail(refundRequest, false);

        return toResponse(refundRequest);
    }

    // ManualRefundGateway (Phase 1, ADR-011) — chỉ ghi nhận trạng thái đã hoàn tiền thủ công ngoài
    // hệ thống, KHÔNG gọi bất kỳ gateway API refund thật nào. "Claim" độc quyền qua
    // claimForManualCompletion() TRƯỚC khi gọi gateway — RefundGatewayPort sẽ được thay bằng adapter
    // thật gọi HTTP ở Phase 2 (ADR-011), nên phải đóng race "2 admin cùng markCompleted" ở đây, không
    // để tới lúc có adapter thật mới lộ ra thành gọi refund API 2 lần cho cùng 1 request.
    @Audited(action = "REFUND_MARK_COMPLETED", targetType = "REFUND_REQUEST", targetIdExpression = "#id")
    @Transactional
    public RefundResponse markCompleted(Integer id) {
        RefundRequests refundRequest = loadWithDetails(id);
        LocalDateTime completedAt = LocalDateTime.now();

        int claimed = refundRequestRepository.claimForManualCompletion(id, completedAt);
        if (claimed == 0) {
            throw new ConflictException(
                    "Chỉ có thể đánh dấu hoàn tất cho yêu cầu đã được duyệt và chưa được đánh dấu hoàn tất trước đó");
        }

        RefundGatewayPort.RefundOutcome outcome = refundGatewayPort.executeRefund(
                new RefundGatewayPort.RefundContext(
                        refundRequest.getId(),
                        refundRequest.getPayment().getAmount(),
                        "Hoàn tiền khóa học #" + refundRequest.getPayment().getCourse().getCourseId()
                )
        );
        if (!outcome.success()) {
            // @Transactional rollback undo luôn claimForManualCompletion() ở trên — request quay lại
            // đúng APPROVED/NOT_STARTED, không kẹt ở trạng thái "đã hoàn tất" trong khi gateway thật
            // báo thất bại. Admin thấy lỗi rõ (502) và có thể bấm lại.
            throw new BadGatewayException("Gateway hoàn tiền báo thất bại, chưa đánh dấu hoàn tất");
        }

        refundRequest.setExecutionStatus(RefundExecutionStatus.MANUAL_COMPLETED);
        refundRequest.setGatewayRefundReference(outcome.gatewayRefundReference());
        refundRequest.setCompletedAt(completedAt);
        refundRequestRepository.save(refundRequest);

        return toResponse(refundRequest);
    }

    private RefundRequests loadWithDetails(Integer id) {
        return refundRequestRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy yêu cầu hoàn tiền"));
    }

    // PRD-031 — email kết quả xử lý yêu cầu hoàn tiền. Không bọc try/catch nuốt lỗi: nếu gửi thất
    // bại, toàn bộ quyết định duyệt/từ chối rollback theo @Transactional, Admin thấy lỗi rõ và có
    // thể bấm lại — tránh trạng thái DB đã đổi nhưng Student không được thông báo.
    private void sendDecisionEmail(RefundRequests refundRequest, boolean approved) {
        String courseTitle = refundRequest.getPayment().getCourse().getTitle();
        String subject = approved
                ? "Yêu cầu hoàn tiền của bạn đã được duyệt"
                : "Yêu cầu hoàn tiền của bạn đã bị từ chối";
        String body = approved
                ? "Yêu cầu hoàn tiền cho khóa học \"" + courseTitle + "\" của bạn đã được duyệt. "
                        + "Chúng tôi sẽ xử lý hoàn tiền trong thời gian sớm nhất."
                : "Yêu cầu hoàn tiền cho khóa học \"" + courseTitle + "\" của bạn đã bị từ chối. Lý do: "
                        + refundRequest.getAdminNote();

        emailSenderPort.send(refundRequest.getStudent().getEmail(), subject, body);
    }

    private void persistIdempotencyKey(String idempotencyKey, Users student, RefundRequests refundRequest) {
        RefundIdempotencyKey key = new RefundIdempotencyKey();
        key.setIdempotencyKey(idempotencyKey);
        key.setStudent(student);
        key.setRefundRequest(refundRequest);

        // saveAndFlush (không phải save) — buộc INSERT ngay tại đây thay vì hoãn tới lúc commit, để
        // vi phạm unique constraint nổ ra thành DataIntegrityViolationException (bắt được ở
        // controller) thay vì TransactionSystemException lúc commit. Cùng nguyên tắc
        // PaymentService.persistIdempotencyKey (Phase 19).
        refundIdempotencyKeyRepository.saveAndFlush(key);
    }

    private RefundResponse toResponse(RefundRequests r) {
        Payments payment = r.getPayment();
        return new RefundResponse(
                r.getId(),
                payment.getPaymentId(),
                r.getStudent().getUserId(),
                payment.getCourse().getCourseId(),
                payment.getCourse().getTitle(),
                payment.getAmount(),
                r.getReason(),
                r.getBusinessStatus(),
                r.getAdminNote(),
                r.getExecutionStatus(),
                r.getGatewayRefundReference(),
                r.getRequestedAt(),
                r.getDecidedAt(),
                r.getCompletedAt()
        );
    }
}
