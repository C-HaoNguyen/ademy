package com.example.academic_management_api.infrastructure.payment;

import com.example.academic_management_api.application.port.PaymentGatewayPort;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Component
public class VnPayGateway implements PaymentGatewayPort {

    private static final DateTimeFormatter CREATE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final String tmnCode;
    private final String hashSecret;
    private final String payUrl;
    private final String returnUrl;
    private final boolean configured;

    public VnPayGateway(
            @Value("${vnpay.tmn-code:}") String tmnCode,
            @Value("${vnpay.hash-secret:}") String hashSecret,
            @Value("${vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") String payUrl,
            @Value("${vnpay.return-url:}") String returnUrl
    ) {
        this.tmnCode = tmnCode;
        this.hashSecret = hashSecret;
        this.payUrl = payUrl;
        this.returnUrl = returnUrl;
        this.configured = !tmnCode.isBlank() && !hashSecret.isBlank() && !returnUrl.isBlank();
    }

    @Override
    public String gatewayId() {
        return "vnpay";
    }

    @Override
    public CheckoutSession createCheckoutSession(CheckoutRequest request) {
        if (!configured) {
            throw new ServiceUnavailableException("VNPay chưa được cấu hình");
        }

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", toVnpAmount(request.amount()));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", request.transactionRef());
        params.put("vnp_OrderInfo", request.orderInfo());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", LocalDateTime.now().format(CREATE_DATE_FORMAT));

        String encodedQuery = buildEncodedQuery(params);
        String secureHash = hmacSHA512(hashSecret, encodedQuery);
        String redirectUrl = payUrl + "?" + encodedQuery + "&vnp_SecureHash=" + secureHash;

        return new CheckoutSession(redirectUrl, request.transactionRef());
    }

    @Override
    public CallbackResult verifyCallback(CallbackPayload payload) {
        Map<String, String> params = payload.params();
        if (!configured || params == null) {
            return new CallbackResult(false, null, false);
        }

        Map<String, String> toVerify = new TreeMap<>(params);
        String receivedHash = toVerify.remove("vnp_SecureHash");
        toVerify.remove("vnp_SecureHashType");

        if (receivedHash == null) {
            return new CallbackResult(false, null, false);
        }

        String expectedHash = hmacSHA512(hashSecret, buildEncodedQuery(toVerify));
        if (!expectedHash.equalsIgnoreCase(receivedHash)) {
            return new CallbackResult(false, null, false);
        }

        String transactionRef = params.get("vnp_TxnRef");
        boolean success = "00".equals(params.get("vnp_ResponseCode"));
        return new CallbackResult(true, transactionRef, success);
    }

    // VNPay yêu cầu vnp_Amount = số tiền thật * 100 (đơn vị nhỏ nhất VNPay dùng nội bộ).
    private static String toVnpAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .toBigInteger()
                .toString();
    }

    private static String buildEncodedQuery(Map<String, String> sortedParams) {
        return sortedParams.entrySet().stream()
                .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    private static String hmacSHA512(String key, String data) {
        return HmacUtil.hex("HmacSHA512", key, data);
    }
}
