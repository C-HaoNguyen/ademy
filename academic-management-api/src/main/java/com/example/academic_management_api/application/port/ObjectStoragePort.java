package com.example.academic_management_api.application.port;

import java.time.Instant;

public interface ObjectStoragePort {

    PresignedUpload generatePresignedUploadUrl(String objectKey, String contentType);

    record PresignedUpload(String uploadUrl, String objectKey, String publicUrl, Instant expiresAt) {
    }
}
