package com.example.academic_management_api.payment.controller;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.infrastructure.payment.MomoGateway;
import com.example.academic_management_api.infrastructure.payment.StripeGateway;
import com.example.academic_management_api.infrastructure.payment.VnPayGateway;
import com.example.academic_management_api.payment.dto.CouponPreviewResponse;
import com.example.academic_management_api.payment.dto.CouponValidationRequest;
import com.example.academic_management_api.payment.dto.MyPaymentDto;
import com.example.academic_management_api.payment.dto.PaymentRequest;
import com.example.academic_management_api.payment.dto.PaymentResponse;
import com.example.academic_management_api.payment.service.PaymentCallbackOutcome;
import com.example.academic_management_api.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/payments")
public class PaymentController {
    private final PaymentService paymentService;
    private final VnPayGateway vnPayGateway;
    private final MomoGateway momoGateway;
    private final StripeGateway stripeGateway;

    public PaymentController(
            PaymentService paymentService,
            VnPayGateway vnPayGateway,
            MomoGateway momoGateway,
            StripeGateway stripeGateway
    ) {
        this.paymentService = paymentService;
        this.vnPayGateway = vnPayGateway;
        this.momoGateway = momoGateway;
        this.stripeGateway = stripeGateway;
    }

    @PostMapping("/checkout")
    public ResponseEntity<PaymentResponse> checkout(
            @Valid @RequestBody PaymentRequest request,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            Authentication authentication
    ) {
        if (paymentService.isLiveMode()) {
            return checkoutLive(request, idempotencyKey, authentication.getName());
        }

        try {
            return paymentService.checkout(request, idempotencyKey, authentication.getName());
        } catch (DataIntegrityViolationException e) {
            // Một request khác (cùng Idempotency-Key, hoặc cùng student+course nhưng key khác)
            // đã thắng race condition và commit trước trong lúc transaction của request này đang
            // chạy — trả lại kết quả phù hợp thay vì lỗi 500 (ADR-007, EC-001). Gọi ở đây (không
            // phải trong PaymentService) để chạy trong một transaction mới, vì transaction cũ đã
            // bị DB đánh dấu aborted.
            return paymentService.resolveCheckoutConflict(idempotencyKey);
        }
    }

    // Live mode (Phase 21): 2 bước ở 2 transaction riêng, gọi từ đây (không phải PaymentService tự
    // gọi lẫn nhau — self-invocation sẽ bỏ qua @Transactional của Spring proxy). Bước 1 ghi DB xong
    // mới bước 2 gọi gateway thật, đúng ADR-006.
    private ResponseEntity<PaymentResponse> checkoutLive(PaymentRequest request, String idempotencyKey, String username) {
        PaymentService.LiveCheckoutInit init;
        try {
            init = paymentService.createPendingPayment(request, idempotencyKey, username);
        } catch (DataIntegrityViolationException e) {
            return paymentService.resolveLiveCheckoutConflict(idempotencyKey);
        }

        if (init.shortCircuit() != null) {
            return init.shortCircuit();
        }

        return paymentService.initiateGatewaySession(init.payment(), idempotencyKey);
    }

    // Checkout Bước 1 (UI_SPEC §2.8) — nút "Áp dụng" coupon. Route mặc định rơi vào nhánh
    // "authenticated" của SecurityConfig (không phải /admin, /courses, /enrollments) — khớp đúng
    // "mọi role đã đăng nhập" mà /checkout hiện cho phép. Không commit redemption — chỉ preview.
    @PostMapping("/coupons/validate")
    public CouponPreviewResponse validateCoupon(@Valid @RequestBody CouponValidationRequest request) {
        return paymentService.previewCoupon(request.getCouponCode(), request.getCourseId());
    }

    // Route rơi vào anyRequest().authenticated() mặc định (cùng tiền lệ /refund-requests,
    // /quizzes/**) — Student tự tra payment của chính mình, ownership qua authentication.getName().
    @GetMapping("/me")
    public ResponseEntity<List<MyPaymentDto>> getMyPayments(Authentication authentication) {
        return ResponseEntity.ok(paymentService.getMyPayments(authentication.getName()));
    }

    @GetMapping("/callback/vnpay")
    public ResponseEntity<Map<String, String>> vnpayCallback(@RequestParam Map<String, String> params) {
        PaymentGatewayPort.CallbackResult result = vnPayGateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(params, null, null));
        return ResponseEntity.ok(vnpayAck(paymentService.processCallback(result)));
    }

    @PostMapping("/callback/momo")
    public ResponseEntity<Void> momoCallback(@RequestBody Map<String, Object> body) {
        Map<String, String> params = body.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> String.valueOf(e.getValue())));
        PaymentGatewayPort.CallbackResult result = momoGateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(params, null, null));
        paymentService.processCallback(result);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/callback/stripe")
    public ResponseEntity<Void> stripeCallback(
            @RequestBody String rawBody,
            @RequestHeader("Stripe-Signature") String signatureHeader
    ) {
        PaymentGatewayPort.CallbackResult result = stripeGateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(null, rawBody, signatureHeader));
        paymentService.processCallback(result);
        return ResponseEntity.ok().build();
    }

    // Format ack theo đúng convention IPN thật của VNPay (RspCode/Message) — VNPay sẽ tự retry
    // callback nếu không nhận được response đúng format này.
    private Map<String, String> vnpayAck(PaymentCallbackOutcome outcome) {
        return switch (outcome) {
            case INVALID_SIGNATURE -> Map.of("RspCode", "97", "Message", "Invalid signature");
            case NOT_FOUND -> Map.of("RspCode", "01", "Message", "Order not found");
            case IGNORED, ALREADY_PROCESSED -> Map.of("RspCode", "02", "Message", "Order already confirmed");
            case PROCESSED -> Map.of("RspCode", "00", "Message", "Confirm Success");
        };
    }
}
