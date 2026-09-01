package com.example.academic_management_api.audit.service;

import com.example.academic_management_api.audit.entity.AuditLog;
import com.example.academic_management_api.audit.repository.AuditLogRepository;
import com.example.academic_management_api.user.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogWriter {

    private static final Logger log = LoggerFactory.getLogger(AuditLogWriter.class);

    // Khớp varchar(50) của actor_username/target_id trong V10__audit_log.sql. actor_username đặc
    // biệt cần chặn ở đây: với AuthService.login, giá trị này đến từ #request.username — input
    // người dùng tự gõ, không có @Size validation nào chặn trước (LoginRequest chỉ @NotBlank) —
    // username dài hơn cột sẽ làm save() ném DataIntegrityViolationException, bị nuốt bởi catch
    // bên dưới, khiến chính lần thử đăng nhập đáng ngờ nhất (username bất thường/dò brute-force)
    // lại không có audit log nào — ngược hẳn mục đích PRD-033/034.
    private static final int MAX_ACTOR_USERNAME_LENGTH = 50;
    private static final int MAX_TARGET_ID_LENGTH = 50;

    private final AuditLogRepository auditLogRepository;
    private final UserService userService;

    public AuditLogWriter(AuditLogRepository auditLogRepository, UserService userService) {
        this.auditLogRepository = auditLogRepository;
        this.userService = userService;
    }

    // REQUIRES_NEW: bản ghi audit phải tồn tại độc lập với transaction của hành động đang được
    // audit — kể cả khi hành động đó rollback (exception), audit log về lần thử thất bại vẫn phải
    // được lưu lại (đúng PRD-033 "đăng nhập thành công/thất bại"). Tự bắt hết exception bên trong,
    // không cho propagate ra ngoài — lỗi ghi audit log (vd DB tạm thời không tới được) không được
    // phép làm crash/rollback hành vi nghiệp vụ chính đang được audit.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void write(
            String actorUsername,
            String action,
            String targetType,
            String targetId,
            boolean success,
            String metadata
    ) {
        try {
            AuditLog entry = new AuditLog();
            entry.setActorUsername(truncate(actorUsername, MAX_ACTOR_USERNAME_LENGTH));
            userService.findByUsername(actorUsername).ifPresent(entry::setActor);
            entry.setAction(action);
            entry.setTargetType(targetType == null || targetType.isEmpty() ? null : targetType);
            entry.setTargetId(truncate(targetId, MAX_TARGET_ID_LENGTH));
            entry.setSuccess(success);
            entry.setMetadata(metadata);
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Ghi audit log thất bại: action={}, actor={}, target={}/{}",
                    action, actorUsername, targetType, targetId, e);
        }
    }

    private static String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
