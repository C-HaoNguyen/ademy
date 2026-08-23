package com.example.academic_management_api.enrollment.dto;

import jakarta.validation.constraints.NotBlank;

public class RevokeAccessRequest {
    @NotBlank
    private String reason;

    public String getReason() {
        return reason;
    }
}
