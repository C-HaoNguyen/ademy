package com.example.academic_management_api.audit.service;

import com.example.academic_management_api.audit.dto.AuditLogResponse;
import com.example.academic_management_api.audit.entity.AuditLog;
import com.example.academic_management_api.audit.repository.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    // Chặn Admin vô tình (hoặc client lỗi) truyền limit quá lớn kéo cả bảng audit_log vào memory
    // — bảng này tăng nhanh nhất hệ thống, không có archival job ở Phase 1 (ADR-013).
    private static final int DEFAULT_LIMIT = 100;
    private static final int MAX_LIMIT = 500;

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLogResponse> search(
            String actorUsername,
            String action,
            String targetType,
            LocalDateTime from,
            LocalDateTime to,
            Integer limit
    ) {
        int effectiveLimit = clampLimit(limit);
        Pageable pageable = PageRequest.of(0, effectiveLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

        return auditLogRepository.search(actorUsername, action, targetType, from, to, pageable)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private int clampLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return new AuditLogResponse(
                a.getId(),
                a.getActor() != null ? a.getActor().getUserId() : null,
                a.getActorUsername(),
                a.getAction(),
                a.getTargetType(),
                a.getTargetId(),
                a.isSuccess(),
                a.getMetadata(),
                a.getCreatedAt()
        );
    }
}
