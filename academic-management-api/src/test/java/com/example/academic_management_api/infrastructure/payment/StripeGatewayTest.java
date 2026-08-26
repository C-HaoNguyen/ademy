package com.example.academic_management_api.infrastructure.payment;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StripeGatewayTest {

    private static final String WEBHOOK_SECRET = "whsec_test_secret";

    private final StripeGateway gateway = new StripeGateway(
            "sk_test_dummy",
            WEBHOOK_SECRET,
            "http://localhost:8080/payments/callback/stripe",
            "http://localhost:8080/payments/callback/stripe"
    );

    @Test
    void gatewayId_isStripe() {
        assertThat(gateway.gatewayId()).isEqualTo("stripe");
    }

    @Test
    void createCheckoutSession_missingConfig_throwsServiceUnavailable() {
        StripeGateway unconfigured = new StripeGateway("", "", "", "");

        assertThatThrownBy(() -> unconfigured.createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("ref-1", new BigDecimal("100000"), "order")))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void verifyCallback_missingConfig_rejectsWithoutCallingStripeSdk() {
        StripeGateway unconfigured = new StripeGateway("", "", "", "");

        PaymentGatewayPort.CallbackResult result = unconfigured.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(null, "{}", "t=1,v1=deadbeef"));

        assertThat(result.signatureValid()).isFalse();
    }

    @Test
    void verifyCallback_checkoutSessionCompleted_validSignature_extractsClientReferenceId() {
        String payload = """
                {
                  "id": "evt_test_1",
                  "object": "event",
                  "api_version": "2025-05-28.basil",
                  "type": "checkout.session.completed",
                  "data": {
                    "object": {
                      "id": "cs_test_123",
                      "object": "checkout.session",
                      "client_reference_id": "idem-key-1"
                    }
                  }
                }
                """;
        String signatureHeader = buildStripeSignatureHeader(payload, WEBHOOK_SECRET);

        PaymentGatewayPort.CallbackResult result = gateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(null, payload, signatureHeader));

        assertThat(result.signatureValid()).isTrue();
        assertThat(result.success()).isTrue();
        assertThat(result.transactionRef()).isEqualTo("idem-key-1");
    }

    @Test
    void verifyCallback_irrelevantEventType_signatureValidButNotSuccess() {
        String payload = """
                {
                  "id": "evt_test_2",
                  "object": "event",
                  "api_version": "2025-05-28.basil",
                  "type": "payment_intent.created",
                  "data": {
                    "object": {
                      "id": "pi_test_123",
                      "object": "payment_intent"
                    }
                  }
                }
                """;
        String signatureHeader = buildStripeSignatureHeader(payload, WEBHOOK_SECRET);

        PaymentGatewayPort.CallbackResult result = gateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(null, payload, signatureHeader));

        assertThat(result.signatureValid()).isTrue();
        assertThat(result.success()).isFalse();
        assertThat(result.transactionRef()).isNull();
    }

    @Test
    void verifyCallback_wrongSecret_isRejected() {
        String payload = "{\"id\":\"evt_x\",\"object\":\"event\",\"type\":\"checkout.session.completed\"}";
        String signatureHeader = buildStripeSignatureHeader(payload, "whsec_wrong_secret");

        PaymentGatewayPort.CallbackResult result = gateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(null, payload, signatureHeader));

        assertThat(result.signatureValid()).isFalse();
    }

    // Tái hiện đúng scheme ký webhook thật của Stripe: header "t=<timestamp>,v1=<hex hmac>" với
    // hmac = HMAC-SHA256(secret, "<timestamp>.<payload>") — theo tài liệu chính thức Stripe
    // (https://docs.stripe.com/webhooks#verify-manually).
    private static String buildStripeSignatureHeader(String payload, String secret) {
        long timestamp = System.currentTimeMillis() / 1000;
        String signedPayload = timestamp + "." + payload;
        String signature = hmacSHA256(secret, signedPayload);
        return "t=" + timestamp + ",v1=" + signature;
    }

    private static String hmacSHA256(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] result = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
