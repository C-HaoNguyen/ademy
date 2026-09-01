package com.example.academic_management_api.audit.controller;

import com.example.academic_management_api.audit.dto.AuditLogResponse;
import com.example.academic_management_api.audit.service.AuditLogService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

// Route /admin/audit-logs đã nằm dưới /admin/** -> hasRole("ADMIN") ở SecurityConfig,
// không cần thêm matcher riêng.
@RestController
@RequestMapping("/admin/audit-logs")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    public AdminAuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public List<AuditLogResponse> search(
            @RequestParam(required = false) String actorUsername,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Integer limit
    ) {
        return auditLogService.search(actorUsername, action, targetType, from, to, limit);
    }
}
