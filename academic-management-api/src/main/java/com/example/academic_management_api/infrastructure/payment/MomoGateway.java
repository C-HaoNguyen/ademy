package com.example.academic_management_api.infrastructure.payment;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.BadGatewayException;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class MomoGateway implements PaymentGatewayPort {

    private final String partnerCode;
    private final String accessKey;
    private final String secretKey;
    private final String endpoint;
    private final String redirectUrl;
    private final String ipnUrl;
    private final boolean configured;
    private final RestTemplate restTemplate;

    @Autowired
    public MomoGateway(
            @Value("${momo.partner-code:}") String partnerCode,
            @Value("${momo.access-key:}") String accessKey,
            @Value("${momo.secret-key:}") String secretKey,
            @Value("${momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}") String endpoint,
            @Value("${momo.redirect-url:}") String redirectUrl,
            @Value("${momo.ipn-url:}") String ipnUrl,
            RestTemplateBuilder restTemplateBuilder
    ) {
        this(partnerCode, accessKey, secretKey, endpoint, redirectUrl, ipnUrl, restTemplateBuilder
                // Không set timeout sẽ khiến thread xử lý request checkout của Student bị block vô
                // hạn nếu Momo treo/rớt mạng giữa chừng — dưới tải cao có thể cạn kiệt thread pool
                // của cả server, không chỉ ảnh hưởng payment.
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build());
    }

    // Constructor phụ (package-private) để unit test tiêm RestTemplate giả, không cần Spring context.
    MomoGateway(
            String partnerCode,
            String accessKey,
            String secretKey,
            String endpoint,
            String redirectUrl,
            String ipnUrl,
            RestTemplate restTemplate
    ) {
        this.partnerCode = partnerCode;
        this.accessKey = accessKey;
        this.secretKey = secretKey;
        this.endpoint = endpoint;
        this.redirectUrl = redirectUrl;
        this.ipnUrl = ipnUrl;
        this.restTemplate = restTemplate;
        this.configured = !partnerCode.isBlank() && !accessKey.isBlank() && !secretKey.isBlank()
                && !redirectUrl.isBlank() && !ipnUrl.isBlank();
    }

    @Override
    public String gatewayId() {
        return "momo";
    }

    @Override
    public CheckoutSession createCheckoutSession(CheckoutRequest request) {
        if (!configured) {
            throw new ServiceUnavailableException("Momo chưa được cấu hình");
        }

        String requestId = request.transactionRef();
        String orderId = request.transactionRef();
        String amount = toMomoAmount(request.amount());
        String extraData = "";
        String requestType = "captureWallet";

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + request.orderInfo()
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        String signature = hmacSHA256(secretKey, rawSignature);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("accessKey", accessKey);
        body.put("requestId", requestId);
        body.put("amount", amount);
        body.put("orderId", orderId);
        body.put("orderInfo", request.orderInfo());
        body.put("redirectUrl", redirectUrl);
        body.put("ipnUrl", ipnUrl);
        body.put("extraData", extraData);
        body.put("requestType", requestType);
        body.put("signature", signature);
        body.put("lang", "vi");

        Map<?, ?> response;
        try {
            response = restTemplate.postForObject(endpoint, body, Map.class);
        } catch (RestClientException e) {
            throw new BadGatewayException("Không gọi được Momo để tạo phiên thanh toán");
        }

        if (response == null || !"0".equals(String.valueOf(response.get("resultCode")))) {
            String message = response != null ? String.valueOf(response.get("message")) : "không có phản hồi";
            throw new BadGatewayException("Momo từ chối tạo phiên thanh toán: " + message);
        }

        return new CheckoutSession(String.valueOf(response.get("payUrl")), orderId);
    }

    @Override
    public CallbackResult verifyCallback(CallbackPayload payload) {
        Map<String, String> p = payload.params();
        if (!configured || p == null) {
            return new CallbackResult(false, null, false);
        }

        String receivedSignature = p.get("signature");
        if (receivedSignature == null) {
            return new CallbackResult(false, null, false);
        }

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + p.getOrDefault("amount", "")
                + "&extraData=" + p.getOrDefault("extraData", "")
                + "&message=" + p.getOrDefault("message", "")
                + "&orderId=" + p.getOrDefault("orderId", "")
                + "&orderInfo=" + p.getOrDefault("orderInfo", "")
                + "&orderType=" + p.getOrDefault("orderType", "")
                + "&partnerCode=" + p.getOrDefault("partnerCode", "")
                + "&payType=" + p.getOrDefault("payType", "")
                + "&requestId=" + p.getOrDefault("requestId", "")
                + "&responseTime=" + p.getOrDefault("responseTime", "")
                + "&resultCode=" + p.getOrDefault("resultCode", "")
                + "&transId=" + p.getOrDefault("transId", "");

        String expectedSignature = hmacSHA256(secretKey, rawSignature);
        if (!expectedSignature.equalsIgnoreCase(receivedSignature)) {
            return new CallbackResult(false, null, false);
        }

        boolean success = "0".equals(p.get("resultCode"));
        return new CallbackResult(true, p.get("orderId"), success);
    }

    // Momo dùng thẳng số tiền VND nguyên (khác VNPay không nhân 100).
    private static String toMomoAmount(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.HALF_UP).toBigInteger().toString();
    }

    private static String hmacSHA256(String key, String data) {
        return HmacUtil.hex("HmacSHA256", key, data);
    }
}
