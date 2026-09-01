package com.example.academic_management_api.audit.dto;

import java.time.LocalDateTime;

public class AuditLogResponse {
    private final Integer id;
    private final Integer actorUserId;
    private final String actorUsername;
    private final String action;
    private final String targetType;
    private final String targetId;
    private final boolean success;
    private final String metadata;
    private final LocalDateTime createdAt;

    public AuditLogResponse(
            Integer id,
            Integer actorUserId,
            String actorUsername,
            String action,
            String targetType,
            String targetId,
            boolean success,
            String metadata,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.actorUserId = actorUserId;
        this.actorUsername = actorUsername;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.success = success;
        this.metadata = metadata;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public Integer getActorUserId() {
        return actorUserId;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public String getAction() {
        return action;
    }

    public String getTargetType() {
        return targetType;
    }

    public String getTargetId() {
        return targetId;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMetadata() {
        return metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
