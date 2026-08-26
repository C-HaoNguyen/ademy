package com.example.academic_management_api.infrastructure.storage;

import com.example.academic_management_api.application.port.ObjectStoragePort;
import com.example.academic_management_api.common.exception.ServiceUnavailableException;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;

@Component
public class R2ObjectStorageAdapter implements ObjectStoragePort {

    private final String bucketName;
    private final String publicBaseUrl;
    private final Duration presignExpiry;
    private final boolean configured;
    private final S3Presigner presigner;

    public R2ObjectStorageAdapter(
            @Value("${r2.endpoint}") String endpoint,
            @Value("${r2.access-key-id}") String accessKeyId,
            @Value("${r2.secret-access-key}") String secretAccessKey,
            @Value("${r2.bucket-name}") String bucketName,
            @Value("${r2.public-base-url}") String publicBaseUrl,
            @Value("${r2.presign-expiry-seconds:900}") long presignExpirySeconds
    ) {
        this.bucketName = bucketName;
        this.publicBaseUrl = publicBaseUrl;
        this.presignExpiry = Duration.ofSeconds(presignExpirySeconds);
        this.configured = !endpoint.isBlank() && !accessKeyId.isBlank()
                && !secretAccessKey.isBlank() && !bucketName.isBlank() && !publicBaseUrl.isBlank();

        this.presigner = configured
                ? S3Presigner.builder()
                        .region(Region.of("auto"))
                        .endpointOverride(URI.create(endpoint))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                        .serviceConfiguration(S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                        .build()
                : null;
    }

    @Override
    public PresignedUpload generatePresignedUploadUrl(String objectKey, String contentType) {
        if (!configured) {
            throw new ServiceUnavailableException("Object storage (R2) chưa được cấu hình");
        }

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(contentType)
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(presignExpiry)
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presigned = presigner.presignPutObject(presignRequest);

        return new PresignedUpload(
                presigned.url().toString(),
                objectKey,
                publicBaseUrl + "/" + objectKey,
                Instant.now().plus(presignExpiry)
        );
    }

    @PreDestroy
    void close() {
        if (presigner != null) {
            presigner.close();
        }
    }
}
