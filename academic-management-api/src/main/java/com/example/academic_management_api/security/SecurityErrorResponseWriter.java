package com.example.academic_management_api.security;

import com.example.academic_management_api.common.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;

final class SecurityErrorResponseWriter {

    private SecurityErrorResponseWriter() {
    }

    static void write(
            HttpServletResponse response,
            HttpServletRequest request,
            HttpStatus status,
            String message,
            ObjectMapper objectMapper
    ) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        ErrorResponse body = new ErrorResponse(
                status.value(),
                status.getReasonPhrase(),
                message,
                null,
                request.getRequestURI()
        );
        objectMapper.writeValue(response.getWriter(), body);
    }
}
