package com.example.academic_management_api.infrastructure.payment;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * HMAC hex-encode dùng chung cho các gateway thanh toán (VNPay dùng HmacSHA512, Momo dùng
 * HmacSHA256) — tránh lặp lại boilerplate Mac/SecretKeySpec/hex-encode ở từng adapter.
 */
final class HmacUtil {

    private HmacUtil() {
    }

    static String hex(String algorithm, String key, String data) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), algorithm));
            byte[] result = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(result);
        } catch (Exception e) {
            throw new IllegalStateException("Không tính được HMAC (" + algorithm + ")", e);
        }
    }
}
