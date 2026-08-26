package com.example.academic_management_api.payment.service;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final String LIVE_MODE = "live";

    private final PaymentRepository paymentRepository;
    private final PaymentIdempotencyKeyRepository paymentIdempotencyKeyRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentService enrollmentService;
    private final Map<String, PaymentGatewayPort> gatewaysById;
    private final String paymentMode;

    public PaymentService(
            PaymentRepository paymentRepository,
            PaymentIdempotencyKeyRepository paymentIdempotencyKeyRepository,
            CourseRepository courseRepository,
            UserRepository userRepository,
            EnrollmentService enrollmentService,
            List<PaymentGatewayPort> gateways,
            @Value("${payment.mode:mock}") String paymentMode
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentIdempotencyKeyRepository = paymentIdempotencyKeyRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrollmentService = enrollmentService;
        this.gatewaysById = gateways.stream()
                .collect(Collectors.toMap(PaymentGatewayPort::gatewayId, Function.identity()));
        this.paymentMode = paymentMode;
    }

    public boolean isLiveMode() {
        return LIVE_MODE.equalsIgnoreCase(paymentMode);
    }

    // ---------------------------------------------------------------------
    // Mock mode (Phase 19) — giữ nguyên 100% hành vi hiện có. Còn tồn tại tạm thời cho tới khi
    // Stage J (Checkout redesign, Phase 33) chuyển hẳn FE sang gọi live mode — xem điều kiện xóa
    // ở REFACTOR_PLAN.md Phase 21.
    // ---------------------------------------------------------------------

    @Transactional
    public ResponseEntity<PaymentResponse> checkout(PaymentRequest request, String idempotencyKey, String username) {

        Optional<PaymentIdempotencyKey> existingKey = paymentIdempotencyKeyRepository.findById(idempotencyKey);
        if (existingKey.isPresent()) {
            return ResponseEntity.ok(
                    new PaymentResponse(true, "Thanh toán thành công")
            );
        }

        ValidatedCheckout validated = validateCheckout(request, username);
        if (isAlreadyEnrolled(validated)) {
            return alreadyEnrolledResponse();
        }

        Payments payment = buildPayment(validated, request, PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        enrollmentService.createEnrollment(validated.student(), validated.course());

        persistIdempotencyKey(idempotencyKey, validated.student(), payment);

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

    // ---------------------------------------------------------------------
    // Live mode (Phase 21) — VNPay/Momo là redirect flow, Stripe là API-based: không thể trả kết
    // quả cuối cùng ngay trong response của /payments/checkout như mock. Tách 2 bước, gọi từ
    // PaymentController (không phải tự gọi lẫn nhau trong service — self-invocation sẽ bỏ qua
    // @Transactional của Spring proxy): (1) createPendingPayment() ghi Payments PENDING trong 1
    // transaction riêng, commit xong mới trả về; (2) initiateGatewaySession() gọi gateway thật
    // NGOÀI transaction (đúng ADR-006 "gateway call nên xảy ra ngoài transaction ghi DB"), rồi tự
    // lưu gatewayTransactionRef qua repository (transaction riêng của chính lệnh save()).
    // Enrollment CHƯA được tạo ở bước nào trong luồng live — chỉ tạo khi processCallback() nhận
    // callback xác nhận SUCCESS thật từ gateway.
    // ---------------------------------------------------------------------

    @Transactional
    public LiveCheckoutInit createPendingPayment(PaymentRequest request, String idempotencyKey, String username) {
        Optional<PaymentIdempotencyKey> existingKey = paymentIdempotencyKeyRepository.findById(idempotencyKey);
        if (existingKey.isPresent()) {
            return new LiveCheckoutInit(ResponseEntity.ok(toReplayResponse(existingKey.get().getPayment())), null);
        }

        ValidatedCheckout validated = validateCheckout(request, username);
        if (isAlreadyEnrolled(validated)) {
            return new LiveCheckoutInit(alreadyEnrolledResponse(), null);
        }

        Payments payment = buildPayment(validated, request, PaymentStatus.PENDING);
        paymentRepository.save(payment);

        persistIdempotencyKey(idempotencyKey, validated.student(), payment);

        return new LiveCheckoutInit(null, payment);
    }

    // Cùng cơ chế phân biệt như resolveCheckoutConflict() ở trên, nhưng phản ánh đúng trạng thái
    // PENDING/SUCCESS/FAILED thật của live mode thay vì luôn giả định "Thanh toán thành công".
    public ResponseEntity<PaymentResponse> resolveLiveCheckoutConflict(String idempotencyKey) {
        Optional<PaymentIdempotencyKey> existingKey = paymentIdempotencyKeyRepository.findById(idempotencyKey);

        if (existingKey.isPresent()) {
            return ResponseEntity.ok(toReplayResponse(existingKey.get().getPayment()));
        }

        return ResponseEntity.badRequest().body(
                new PaymentResponse(false, "Bạn đã đăng ký khóa học này")
        );
    }

    public ResponseEntity<PaymentResponse> initiateGatewaySession(Payments payment, String transactionRef) {
        PaymentGatewayPort gateway = resolveGateway(PaymentMethod.valueOf(payment.getPaymentMethod()));

        PaymentGatewayPort.CheckoutSession session = gateway.createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest(
                        transactionRef,
                        payment.getAmount(),
                        "Thanh toán khóa học #" + payment.getCourse().getCourseId()
                )
        );

        payment.setGatewayTransactionRef(session.gatewayTransactionRef());
        paymentRepository.save(payment);

        PaymentResponse response = new PaymentResponse(true, "Đang chuyển hướng tới cổng thanh toán");
        response.setRedirectUrl(session.redirectUrl());
        return ResponseEntity.ok(response);
    }

    // Gọi từ endpoint callback/webhook riêng của từng gateway (PaymentController), sau khi adapter
    // tương ứng đã verify chữ ký. Idempotent theo EC-002: callback trễ/lặp lại không được cập nhật
    // trạng thái/enrollment lần 2 — đảm bảo bằng updateStatusIfPending() (single atomic UPDATE, chỉ
    // chuyển trạng thái khi đang PENDING).
    @Transactional
    public PaymentCallbackOutcome processCallback(PaymentGatewayPort.CallbackResult result) {
        if (!result.signatureValid()) {
            return PaymentCallbackOutcome.INVALID_SIGNATURE;
        }

        if (result.transactionRef() == null) {
            return PaymentCallbackOutcome.IGNORED;
        }

        Optional<Payments> paymentOpt = paymentRepository.findByGatewayTransactionRef(result.transactionRef());
        if (paymentOpt.isEmpty()) {
            return PaymentCallbackOutcome.NOT_FOUND;
        }

        Payments payment = paymentOpt.get();
        PaymentStatus newStatus = result.success() ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;

        int updated = paymentRepository.updateStatusIfPending(payment.getPaymentId(), newStatus);
        if (updated == 0) {
            return PaymentCallbackOutcome.ALREADY_PROCESSED;
        }

        if (result.success()) {
            enrollmentService.createEnrollment(payment.getStudent(), payment.getCourse());
        }

        return PaymentCallbackOutcome.PROCESSED;
    }

    private PaymentResponse toReplayResponse(Payments payment) {
        return switch (payment.getStatus()) {
            case SUCCESS -> new PaymentResponse(true, "Thanh toán thành công");
            case FAILED -> new PaymentResponse(false, "Thanh toán thất bại");
            case PENDING -> new PaymentResponse(true, "Đang chờ xác nhận thanh toán từ cổng thanh toán");
        };
    }

    private PaymentGatewayPort resolveGateway(PaymentMethod method) {
        PaymentGatewayPort gateway = gatewaysById.get(method.toValue());
        if (gateway == null) {
            throw new ServiceUnavailableException("Không có gateway nào hỗ trợ phương thức thanh toán này");
        }
        return gateway;
    }

    // Phần validate dùng chung giữa checkout() (mock) và createPendingPayment() (live) — 2 luồng
    // chỉ khác nhau ở status ban đầu của payment (SUCCESS ngay vs PENDING chờ callback) và việc có
    // tạo enrollment ngay hay không, còn phần "course/student có tồn tại không, đã đăng ký chưa"
    // là logic nghiệp vụ giống hệt nhau, tách ra để tránh sửa 1 nhánh mà quên nhánh kia.
    private record ValidatedCheckout(Users student, Courses course) {
    }

    private ValidatedCheckout validateCheckout(PaymentRequest request, String username) {
        Courses course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new NotFoundException("Course not found"));

        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));

        return new ValidatedCheckout(student, course);
    }

    private boolean isAlreadyEnrolled(ValidatedCheckout validated) {
        return enrollmentService.isEnrolled(validated.student().getUserId(), validated.course().getCourseId());
    }

    private ResponseEntity<PaymentResponse> alreadyEnrolledResponse() {
        return ResponseEntity.badRequest().body(new PaymentResponse(false, "Bạn đã đăng ký khóa học này"));
    }

    private Payments buildPayment(ValidatedCheckout validated, PaymentRequest request, PaymentStatus status) {
        Payments payment = new Payments();
        payment.setStudent(validated.student());
        payment.setCourse(validated.course());
        payment.setAmount(validated.course().getPrice());
        payment.setPaymentMethod(request.getPaymentMethod().name());
        payment.setStatus(status);
        return payment;
    }

    private void persistIdempotencyKey(String idempotencyKey, Users student, Payments payment) {
        PaymentIdempotencyKey key = new PaymentIdempotencyKey();
        key.setIdempotencyKey(idempotencyKey);
        key.setStudent(student);
        key.setPayment(payment);

        // saveAndFlush (không phải save) để buộc Hibernate INSERT ngay tại đây thay vì hoãn
        // tới lúc commit — nếu không, vi phạm unique constraint sẽ nổ ra trong pha commit của
        // Spring và bị bọc thành TransactionSystemException thay vì DataIntegrityViolationException,
        // khiến catch ở PaymentController không bắt được. Không bắt exception ngay tại đây: một khi
        // INSERT bị DB từ chối, transaction hiện tại (bao gồm cả payment/enrollment vừa tạo, nếu có)
        // bắt buộc phải rollback toàn bộ — Postgres không cho tiếp tục dùng transaction đã aborted.
        // Để exception propagate cho @Transactional tự rollback đúng; caller (PaymentController) bắt
        // exception này và gọi resolveCheckoutConflict()/resolveLiveCheckoutConflict() ở một
        // transaction mới để xử lý theo đúng loại xung đột đã xảy ra (ADR-007, EC-001).
        paymentIdempotencyKeyRepository.saveAndFlush(key);
    }

    public record LiveCheckoutInit(ResponseEntity<PaymentResponse> shortCircuit, Payments payment) {
    }
}
