package com.example.academic_management_api.infrastructure.storage;

import com.example.academic_management_api.application.port.ObjectStoragePort;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class R2ObjectStorageAdapterTest {

    private final R2ObjectStorageAdapter adapter = new R2ObjectStorageAdapter(
            "https://test-account.r2.cloudflarestorage.com",
            "test-access-key",
            "test-secret-key",
            "test-bucket",
            "https://videos.example.com",
            300
    );

    @Test
    void generatePresignedUploadUrl_returnsUrlForRequestedKeyAndBucket() {
        ObjectStoragePort.PresignedUpload result =
                adapter.generatePresignedUploadUrl("courses/1/lessons/2/video/abc", "video/mp4");

        assertThat(result.uploadUrl()).contains("test-bucket");
        assertThat(result.uploadUrl()).contains("courses/1/lessons/2/video/abc");
        assertThat(result.objectKey()).isEqualTo("courses/1/lessons/2/video/abc");
        assertThat(result.publicUrl()).isEqualTo("https://videos.example.com/courses/1/lessons/2/video/abc");
    }

    @Test
    void generatePresignedUploadUrl_expiresAtMatchesConfiguredDuration() {
        Instant before = Instant.now();

        ObjectStoragePort.PresignedUpload result =
                adapter.generatePresignedUploadUrl("courses/1/lessons/2/video/abc", "video/mp4");

        Instant after = Instant.now();
        assertThat(result.expiresAt()).isBetween(before.plusSeconds(300), after.plusSeconds(300));
    }

    @Test
    void generatePresignedUploadUrl_missingConfig_throwsServiceUnavailableInsteadOfFailingAtConstruction() {
        R2ObjectStorageAdapter unconfigured = new R2ObjectStorageAdapter("", "", "", "", "", 900);

        assertThatThrownBy(() -> unconfigured.generatePresignedUploadUrl("courses/1/lessons/2/video/abc", "video/mp4"))
                .isInstanceOf(ServiceUnavailableException.class);
    }
}
