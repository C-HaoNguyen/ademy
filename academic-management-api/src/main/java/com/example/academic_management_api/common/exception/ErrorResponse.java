package com.example.academic_management_api.common.exception;

import java.util.Map;

public record ErrorResponse(
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors,
        String path
) {
}
