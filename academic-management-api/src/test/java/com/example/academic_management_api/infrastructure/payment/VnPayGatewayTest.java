package com.example.academic_management_api.infrastructure.payment;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VnPayGatewayTest {

    private final VnPayGateway gateway = new VnPayGateway(
            "test-tmn-code",
            "test-hash-secret",
            "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            "http://localhost:8080/payments/callback/vnpay"
    );

    @Test
    void gatewayId_isVnpay() {
        assertThat(gateway.gatewayId()).isEqualTo("vnpay");
    }

    @Test
    void createCheckoutSession_missingConfig_throwsServiceUnavailable() {
        VnPayGateway unconfigured = new VnPayGateway("", "", "https://x", "");

        assertThatThrownBy(() -> unconfigured.createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("ref-1", new BigDecimal("100000"), "order")))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void createCheckoutSession_buildsSignedRedirectUrlContainingAmountAndTxnRef() {
        PaymentGatewayPort.CheckoutSession session = gateway.createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("txn-ref-1", new BigDecimal("500000.00"), "Thanh toan khoa hoc"));

        assertThat(session.gatewayTransactionRef()).isEqualTo("txn-ref-1");
        assertThat(session.redirectUrl()).startsWith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?");
        assertThat(session.redirectUrl()).contains("vnp_TxnRef=txn-ref-1");
        // 500000.00 * 100 = 50000000 (VNPay dùng đơn vị nhỏ nhất)
        assertThat(session.redirectUrl()).contains("vnp_Amount=50000000");
        assertThat(session.redirectUrl()).contains("vnp_SecureHash=");
    }

    @Test
    void verifyCallback_validSignature_successResponseCode_isAcceptedAsSuccess() {
        Map<String, String> signedParams = signedCallbackParams("00");

        PaymentGatewayPort.CallbackResult result = gateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(signedParams, null, null));

        assertThat(result.signatureValid()).isTrue();
        assertThat(result.success()).isTrue();
        assertThat(result.transactionRef()).isEqualTo("txn-ref-1");
    }

    @Test
    void verifyCallback_validSignature_failureResponseCode_isAcceptedButNotSuccess() {
        Map<String, String> signedParams = signedCallbackParams("24");

        PaymentGatewayPort.CallbackResult result = gateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(signedParams, null, null));

        assertThat(result.signatureValid()).isTrue();
        assertThat(result.success()).isFalse();
    }

    @Test
    void verifyCallback_tamperedSignature_isRejected() {
        Map<String, String> signedParams = signedCallbackParams("00");
        signedParams.put("vnp_SecureHash", "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

        PaymentGatewayPort.CallbackResult result = gateway.verifyCallback(
                new PaymentGatewayPort.CallbackPayload(signedParams, null, null));

        assertThat(result.signatureValid()).isFalse();
    }

    // Xây callback params bằng cách tái dùng chính createCheckoutSession() để lấy đúng thuật toán ký
    // (không hard-code hash mong đợi trong test — tránh test tự kiểm chứng chính nó sai).
    private Map<String, String> signedCallbackParams(String responseCode) {
        PaymentGatewayPort.CheckoutSession session = gateway.createCheckoutSession(
                new PaymentGatewayPort.CheckoutRequest("txn-ref-1", new BigDecimal("100000"), "order"));

        String query = session.redirectUrl().substring(session.redirectUrl().indexOf('?') + 1);
        Map<String, String> params = new LinkedHashMap<>();
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            params.put(kv[0], java.net.URLDecoder.decode(kv[1], java.nio.charset.StandardCharsets.UTF_8));
        }

        // Callback thật có thêm vnp_ResponseCode/vnp_TransactionStatus không nằm trong tập ký ban
        // đầu của bước tạo URL — mô phỏng bằng cách build lại đúng cách VNPay ký callback: thêm
        // field rồi tính lại hash cho đúng tập field mà verifyCallback() sẽ xác minh.
        params.remove("vnp_SecureHash");
        params.put("vnp_ResponseCode", responseCode);
        params.put("vnp_TransactionStatus", responseCode);

        // Ký lại bằng đúng thuật toán VNPay dùng (HMAC-SHA512 trên query đã sort + URL-encode) với
        // cùng secret đã cấu hình cho "gateway" ở trên — mô phỏng cách VNPay tự ký khi gọi callback.
        params.put("vnp_SecureHash", computeExpectedHash(params));
        return params;
    }

    private String computeExpectedHash(Map<String, String> params) {
        try {
            Map<String, String> sorted = new java.util.TreeMap<>(params);
            String data = sorted.entrySet().stream()
                    .map(e -> e.getKey() + "=" + java.net.URLEncoder.encode(e.getValue(), java.nio.charset.StandardCharsets.UTF_8))
                    .collect(java.util.stream.Collectors.joining("&"));

            javax.crypto.Mac hmac = javax.crypto.Mac.getInstance("HmacSHA512");
            hmac.init(new javax.crypto.spec.SecretKeySpec("test-hash-secret".getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] result = hmac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
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
