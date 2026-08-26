package com.example.academic_management_api.course.dto;

import java.time.Instant;

public class PresignVideoResponse {
    private final String uploadUrl;
    private final String objectKey;
    private final String publicUrl;
    private final Instant expiresAt;

    public PresignVideoResponse(String uploadUrl, String objectKey, String publicUrl, Instant expiresAt) {
        this.uploadUrl = uploadUrl;
        this.objectKey = objectKey;
        this.publicUrl = publicUrl;
        this.expiresAt = expiresAt;
    }

    public String getUploadUrl() {
        return uploadUrl;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getPublicUrl() {
        return publicUrl;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
