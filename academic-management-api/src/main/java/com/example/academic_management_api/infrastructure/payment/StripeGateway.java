package com.example.academic_management_api.infrastructure.payment;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.BadGatewayException;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.RoundingMode;

@Component
public class StripeGateway implements PaymentGatewayPort {

    private static final String CHECKOUT_COMPLETED_EVENT = "checkout.session.completed";

    private final String secretKey;
    private final String webhookSecret;
    private final String successUrl;
    private final String cancelUrl;
    private final boolean configured;

    public StripeGateway(
            @Value("${stripe.secret-key:}") String secretKey,
            @Value("${stripe.webhook-secret:}") String webhookSecret,
            @Value("${stripe.success-url:}") String successUrl,
            @Value("${stripe.cancel-url:}") String cancelUrl
    ) {
        this.secretKey = secretKey;
        this.webhookSecret = webhookSecret;
        this.successUrl = successUrl;
        this.cancelUrl = cancelUrl;
        this.configured = !secretKey.isBlank() && !webhookSecret.isBlank()
                && !successUrl.isBlank() && !cancelUrl.isBlank();
    }

    @Override
    public String gatewayId() {
        return "stripe";
    }

    @Override
    public CheckoutSession createCheckoutSession(CheckoutRequest request) {
        if (!configured) {
            throw new ServiceUnavailableException("Stripe chưa được cấu hình");
        }

        Stripe.apiKey = secretKey;

        long unitAmount = request.amount().setScale(0, RoundingMode.HALF_UP).longValueExact();

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .setClientReferenceId(request.transactionRef())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                // VND là zero-decimal currency với Stripe — unitAmount là số nguyên VND, không nhân 100.
                                .setCurrency("vnd")
                                .setUnitAmount(unitAmount)
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName(request.orderInfo())
                                        .build())
                                .build())
                        .build())
                .build();

        try {
            Session session = Session.create(params);
            return new CheckoutSession(session.getUrl(), request.transactionRef());
        } catch (StripeException e) {
            throw new BadGatewayException("Không gọi được Stripe để tạo phiên thanh toán");
        }
    }

    @Override
    public CallbackResult verifyCallback(CallbackPayload payload) {
        if (!configured) {
            return new CallbackResult(false, null, false);
        }

        try {
            Event event = Webhook.constructEvent(payload.rawBody(), payload.signatureHeader(), webhookSecret);

            if (!CHECKOUT_COMPLETED_EVENT.equals(event.getType())) {
                // Chữ ký hợp lệ nhưng là loại event ta không quan tâm (payment_intent.created...) —
                // ack bình thường cho Stripe, không coi là lỗi, không cập nhật payment nào.
                return new CallbackResult(true, null, false);
            }

            String transactionRef = event.getDataObjectDeserializer().getObject()
                    .filter(Session.class::isInstance)
                    .map(Session.class::cast)
                    .map(Session::getClientReferenceId)
                    .orElse(null);

            return new CallbackResult(true, transactionRef, transactionRef != null);
        } catch (SignatureVerificationException e) {
            return new CallbackResult(false, null, false);
        }
    }
}
