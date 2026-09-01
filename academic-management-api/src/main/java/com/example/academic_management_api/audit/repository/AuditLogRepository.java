package com.example.academic_management_api.audit.repository;

import com.example.academic_management_api.audit.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    // Nhận Pageable chỉ để giới hạn số dòng/sắp xếp (LIMIT/OFFSET) — audit_log là bảng tăng
    // nhanh nhất trong hệ thống (mọi hành động nhạy cảm, không có archival job ở Phase 1 theo
    // ADR-013), không giới hạn ở đây sẽ load toàn bộ bảng vào memory khi Admin gọi không filter.
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:actorUsername IS NULL OR a.actorUsername = :actorUsername)
              AND (:action IS NULL OR a.action = :action)
              AND (:targetType IS NULL OR a.targetType = :targetType)
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt <= :to)
            ORDER BY a.createdAt DESC
            """)
    List<AuditLog> search(
            @Param("actorUsername") String actorUsername,
            @Param("action") String action,
            @Param("targetType") String targetType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );
}
