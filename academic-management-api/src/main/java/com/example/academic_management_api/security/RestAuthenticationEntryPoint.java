package com.example.academic_management_api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Chạy khi request KHÔNG có (hoặc có nhưng không hợp lệ/hết hạn) thông tin xác thực
 * và đang chạm vào 1 route yêu cầu đăng nhập -> trả 401, để phân biệt với 403
 * (đã đăng nhập nhưng không đủ quyền, xem {@link RestAccessDeniedHandler}).
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {
        SecurityErrorResponseWriter.write(
                response,
                request,
                HttpStatus.UNAUTHORIZED,
                "Bạn cần đăng nhập để truy cập tài nguyên này",
                objectMapper
        );
    }
}
