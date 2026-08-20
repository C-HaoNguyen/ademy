package com.example.academic_management_api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Chạy khi request ĐÃ xác thực hợp lệ nhưng thiếu quyền (role) cho route đang gọi
 * -> trả 403, để phân biệt với 401 (chưa xác thực, xem {@link RestAuthenticationEntryPoint}).
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {
        SecurityErrorResponseWriter.write(
                response,
                request,
                HttpStatus.FORBIDDEN,
                "Bạn không có quyền truy cập tài nguyên này",
                objectMapper
        );
    }
}
