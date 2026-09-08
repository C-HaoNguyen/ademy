package com.example.academic_management_api.course.dto;

import jakarta.validation.constraints.NotBlank;

// Phase 31 — POST /admin/courses/{id}/force-unpublish (UI_SPEC §5.3 "Modal xác nhận + lý do vi phạm").
public class ForceUnpublishRequest {
    @NotBlank
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
