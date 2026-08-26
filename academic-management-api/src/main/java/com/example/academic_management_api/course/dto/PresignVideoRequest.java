package com.example.academic_management_api.course.dto;

import jakarta.validation.constraints.NotBlank;

public class PresignVideoRequest {
    @NotBlank
    private String contentType;

    public PresignVideoRequest() {
    }

    public PresignVideoRequest(String contentType) {
        this.contentType = contentType;
    }

    public String getContentType() {
        return contentType;
    }
}
