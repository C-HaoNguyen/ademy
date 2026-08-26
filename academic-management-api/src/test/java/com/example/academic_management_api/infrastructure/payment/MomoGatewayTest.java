package com.example.academic_management_api.infrastructure.payment;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.BadGatewayException;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MomoGatewayTest {

    private static final String ACCESS_KEY = "test-access-key";
    private static final String SECRET_KEY = "test-secret-key";

    @Mock
    private RestTemplate restTemplate;

    private MomoGateway gateway() {
        return new MomoGateway(
                "test-partner-code",
                ACCESS_KEY,
                SECRET_KEY,
                "https://test-payment.momo.vn/v2/gateway/api/create",
                "http://localhost:8080/payments/callback/momo",
                "http://localhost:8080/payments/callback/momo",
                restTemplate
        );
    }

    @Test
    void gatewayId_isMomo() {
        assertThat(gateway().gatewayId()).isEqualTo("momo");
    }

    @Test
    void createCheckoutSession_missingConfig_throwsServiceUnavailable() {
        MomoGateway unconfigured = new MomoGateway("", "", "", "https://x", "", "", restTemplate);

        assertThatThrownBy(() -> unconfigured.createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("ref-1", new BigDecimal("100000"), "order")))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void createCheckoutSession_gatewayAccepts_returnsPayUrlFromResponse() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenReturn(Map.of("resultCode", 0, "payUrl", "https://test-payment.momo.vn/pay/abc"));

        PaymentGatewayPort.CheckoutSession session = gateway().createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("txn-ref-1", new BigDecimal("500000"), "order"));

        assertThat(session.redirectUrl()).isEqualTo("https://test-payment.momo.vn/pay/abc");
        assertThat(session.gatewayTransactionRef()).isEqualTo("txn-ref-1");
    }

    @Test
    void createCheckoutSession_gatewayRejects_throwsBadGateway() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenReturn(Map.of("resultCode", 99, "message", "invalid signature"));

        assertThatThrownBy(() -> gateway().createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("txn-ref-1", new BigDecimal("500000"), "order")))
                .isInstanceOf(BadGatewayException.class);
    }

    @Test
    void createCheckoutSession_networkFailure_throwsBadGateway() {
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RestClientException("connection refused"));

        assertThatThrownBy(() -> gateway().createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("txn-ref-1", new BigDecimal("500000"), "order")))
                .isInstanceOf(BadGatewayException.class);
    }

    @Test
    void verifyCallback_validSignature_successResultCode_isAcceptedAsSuccess() {
        Map<String, String> params = signedParams("0");

        PaymentGatewayPort.CallbackResult result = gateway().verifyCallback(
                new PaymentGatewayPort.CallbackPayload(params, null, null));

        assertThat(result.signatureValid()).isTrue();
        assertThat(result.success()).isTrue();
        assertThat(result.transactionRef()).isEqualTo("order-1");
    }

    @Test
    void verifyCallback_validSignature_failureResultCode_isAcceptedButNotSuccess() {
        Map<String, String> params = signedParams("1");

        PaymentGatewayPort.CallbackResult result = gateway().verifyCallback(
                new PaymentGatewayPort.CallbackPayload(params, null, null));

        assertThat(result.signatureValid()).isTrue();
        assertThat(result.success()).isFalse();
    }

    @Test
    void verifyCallback_tamperedSignature_isRejected() {
        Map<String, String> params = signedParams("0");
        params.put("signature", "0000000000000000000000000000000000000000000000000000000000000000");

        PaymentGatewayPort.CallbackResult result = gateway().verifyCallback(
                new PaymentGatewayPort.CallbackPayload(params, null, null));

        assertThat(result.signatureValid()).isFalse();
    }

    private Map<String, String> signedParams(String resultCode) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("partnerCode", "test-partner-code");
        params.put("orderId", "order-1");
        params.put("requestId", "order-1");
        params.put("amount", "500000");
        params.put("orderInfo", "order");
        params.put("orderType", "momo_wallet");
        params.put("transId", "999");
        params.put("resultCode", resultCode);
        params.put("message", "Success");
        params.put("payType", "qr");
        params.put("responseTime", "1700000000000");
        params.put("extraData", "");

        String rawSignature = "accessKey=" + ACCESS_KEY
                + "&amount=" + params.get("amount")
                + "&extraData=" + params.get("extraData")
                + "&message=" + params.get("message")
                + "&orderId=" + params.get("orderId")
                + "&orderInfo=" + params.get("orderInfo")
                + "&orderType=" + params.get("orderType")
                + "&partnerCode=" + params.get("partnerCode")
                + "&payType=" + params.get("payType")
                + "&requestId=" + params.get("requestId")
                + "&responseTime=" + params.get("responseTime")
                + "&resultCode=" + params.get("resultCode")
                + "&transId=" + params.get("transId");

        params.put("signature", hmacSHA256(SECRET_KEY, rawSignature));
        return params;
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
