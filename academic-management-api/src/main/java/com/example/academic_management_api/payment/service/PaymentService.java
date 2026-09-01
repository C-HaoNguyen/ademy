package com.example.academic_management_api.payment.service;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private final CouponService couponService;
    private final Map<String, PaymentGatewayPort> gatewaysById;
    private final String paymentMode;

    public PaymentService(
            PaymentRepository paymentRepository,
            PaymentIdempotencyKeyRepository paymentIdempotencyKeyRepository,
            CourseRepository courseRepository,
            UserRepository userRepository,
            EnrollmentService enrollmentService,
            CouponService couponService,
            List<PaymentGatewayPort> gateways,
            @Value("${payment.mode:mock}") String paymentMode
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentIdempotencyKeyRepository = paymentIdempotencyKeyRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.enrollmentService = enrollmentService;
        this.couponService = couponService;
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

    // suppressOnDataIntegrityViolation: DataIntegrityViolationException từ đây là race condition
    // dự kiến (idempotency-key trùng hoặc student+course trùng đồng thời), PaymentController bắt
    // và gọi resolveCheckoutConflict() ở transaction mới để trả kết quả cuối cùng — method đó tự
    // audit kết quả thật, không log "thất bại" giả ở đây cho 1 request thực ra đã thành công.
    @Audited(
            action = "PAYMENT_CHECKOUT",
            targetType = "COURSE",
            targetIdExpression = "#request.courseId",
            suppressOnDataIntegrityViolation = true
    )
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

        CouponResolution couponResolution = resolveCoupon(request, validated.course());

        Payments payment = buildPayment(validated, request, PaymentStatus.SUCCESS, couponResolution);
        paymentRepository.save(payment);

        consumeCouponOrThrow(couponResolution, payment);

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
    // Không có targetType/targetIdExpression — chỉ idempotencyKey khả dụng ở đây, không map được
    // sang courseId (khác checkout() có sẵn #request.courseId). actor/action/success/timestamp vẫn
    // đủ đáp ứng PRD-034 cho bản ghi audit của lần thử này.
    @Audited(action = "PAYMENT_CHECKOUT")
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

    // Known limitation: AuditAspect chỉ nhận diện thất bại nghiệp vụ khi kết quả trả về trực tiếp
    // là ResponseEntity lỗi (giống checkout() mock mode) — LiveCheckoutInit bọc ResponseEntity bên
    // trong field shortCircuit thay vì trả trực tiếp, nên case "đã enroll"/"idempotency replay" ở
    // đây bị ghi nhận success=true (không throw exception). Chấp nhận được: chỉ lỗi thật (throw
    // NotFoundException/ConflictException từ validateCheckout/resolveCoupon) mới cần audit
    // success=false; không mở rộng AuditAspect để unwrap kiểu trả về tùy biến của từng method.
    @Audited(
            action = "PAYMENT_CHECKOUT",
            targetType = "COURSE",
            targetIdExpression = "#request.courseId",
            suppressOnDataIntegrityViolation = true
    )
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

        // Coupon (nếu có) chỉ được validate ở đây (resolveCoupon() -> resolveValidCoupon() ném
        // ConflictException ngay nếu coupon đã chết), KHÔNG consume redemption tại bước PENDING này
        // — xem consumeCouponIfPresent() ở processCallback() để biết lý do (best practice: chỉ đốt
        // lượt coupon khi tiền đã thực sự vào, không phải lúc khởi tạo giao dịch có thể fail/bỏ ngang).
        CouponResolution couponResolution = resolveCoupon(request, validated.course());

        Payments payment = buildPayment(validated, request, PaymentStatus.PENDING, couponResolution);
        paymentRepository.save(payment);

        persistIdempotencyKey(idempotencyKey, validated.student(), payment);

        return new LiveCheckoutInit(null, payment);
    }

    // Cùng cơ chế phân biệt như resolveCheckoutConflict() ở trên, nhưng phản ánh đúng trạng thái
    // PENDING/SUCCESS/FAILED thật của live mode thay vì luôn giả định "Thanh toán thành công".
    @Audited(action = "PAYMENT_CHECKOUT")
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
            consumeCouponIfPresent(payment);
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

    // ---------------------------------------------------------------------
    // Coupon (Phase 22) — payment service là nơi DUY NHẤT tính amount cuối cùng (ARCHITECTURE.md
    // §7); CouponService chỉ validate/trả về coupon hợp lệ, không tự tính discount hay tự set amount.
    // ---------------------------------------------------------------------

    private record CouponResolution(Coupons coupon, BigDecimal discountAmount) {
        private static final CouponResolution NONE = new CouponResolution(null, BigDecimal.ZERO);
    }

    private CouponResolution resolveCoupon(PaymentRequest request, Courses course) {
        String couponCode = request.getCouponCode();
        if (couponCode == null || couponCode.isBlank()) {
            return CouponResolution.NONE;
        }

        Coupons coupon = couponService.resolveValidCoupon(couponCode, course.getCourseId());
        BigDecimal discountAmount = calculateDiscount(coupon, course.getPrice());
        return new CouponResolution(coupon, discountAmount);
    }

    private BigDecimal calculateDiscount(Coupons coupon, BigDecimal price) {
        BigDecimal discount = switch (coupon.getDiscountType()) {
            case PERCENTAGE -> {
                BigDecimal clampedPercent = coupon.getDiscountValue().min(BigDecimal.valueOf(100));
                yield price.multiply(clampedPercent)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
            case FIXED -> coupon.getDiscountValue().min(price);
        };
        return discount.max(BigDecimal.ZERO);
    }

    // Chỉ dùng ở checkout() (mock mode) — payment SUCCESS ngay lập tức, chưa có tiền thật nào di
    // chuyển qua gateway ngoài, nên an toàn để throw + rollback toàn bộ nếu coupon vừa hết lượt do
    // race. Gọi ngay sau paymentRepository.save(payment) trong cùng transaction checkout — đây là
    // exception ứng dụng bình thường (không phải DB constraint violation), không cần xử lý 2 pha
    // như DataIntegrityViolationException của Idempotency-Key (ADR-007). Live mode KHÔNG dùng method
    // này — xem consumeCouponIfPresent() ở processCallback().
    private void consumeCouponOrThrow(CouponResolution couponResolution, Payments payment) {
        if (couponResolution.coupon() == null) {
            return;
        }
        boolean consumed = couponService.consumeRedemption(
                couponResolution.coupon(), payment, couponResolution.discountAmount());
        if (!consumed) {
            throw new ConflictException("Mã coupon vừa hết lượt sử dụng, vui lòng thử lại");
        }
    }

    // Live mode (Phase 21/22) — gọi từ processCallback() chỉ khi gateway đã xác nhận SUCCESS thật.
    // Best practice cho coupon giới hạn lượt kết hợp payment gateway redirect flow: chỉ "đốt" lượt
    // dùng khi tiền đã thực sự vào, không phải lúc khởi tạo giao dịch (createPendingPayment()) —
    // nếu consume ngay lúc PENDING, 1 giao dịch bị fail/bỏ ngang sẽ khóa vĩnh viễn 1 coupon
    // maxRedemptions thấp dù chưa ai thanh toán thành công (known issue phát hiện qua code review
    // sau khi implement Phase 22 ban đầu — xem REFACTOR_PLAN.md).
    // KHÔNG throw nếu consume thất bại (coupon vừa bị deactivate/hết lượt trong lúc chờ gateway xác
    // nhận, race hiếm) — khác hẳn consumeCouponOrThrow() ở trên: tại đây gateway đã xác nhận tiền
    // thật đã vào, không thể rollback payment SUCCESS/enrollment chỉ vì bookkeeping coupon thất bại.
    // Student vẫn được hưởng đúng discount đã cam kết (amount đã trừ từ lúc tạo PENDING), chỉ có
    // redemption_count không tăng trong trường hợp hiếm này — chấp nhận được, không có cách nào tốt
    // hơn mà không hủy 1 giao dịch tiền thật đã xảy ra.
    private void consumeCouponIfPresent(Payments payment) {
        Coupons coupon = payment.getCoupon();
        if (coupon == null) {
            return;
        }
        BigDecimal discountAmount = payment.getCourse().getPrice().subtract(payment.getAmount());
        couponService.consumeRedemption(coupon, payment, discountAmount);
    }

    // Preview coupon (UI_SPEC §2.8, Checkout Bước 1 — nút "Áp dụng") — tính discount y hệt checkout
    // thật nhưng KHÔNG persist payment/increment redemption_count, để Student xem trước tổng tiền
    // trước khi xác nhận thanh toán.
    public CouponPreviewResponse previewCoupon(String couponCode, Integer courseId) {
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        Coupons coupon = couponService.resolveValidCoupon(couponCode, courseId);
        BigDecimal discountAmount = calculateDiscount(coupon, course.getPrice());
        BigDecimal finalAmount = course.getPrice().subtract(discountAmount);

        return new CouponPreviewResponse(discountAmount, finalAmount);
    }

    private Payments buildPayment(
            ValidatedCheckout validated,
            PaymentRequest request,
            PaymentStatus status,
            CouponResolution couponResolution
    ) {
        Payments payment = new Payments();
        payment.setStudent(validated.student());
        payment.setCourse(validated.course());
        payment.setAmount(validated.course().getPrice().subtract(couponResolution.discountAmount()));
        payment.setPaymentMethod(request.getPaymentMethod().name());
        payment.setStatus(status);
        payment.setCoupon(couponResolution.coupon());
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
