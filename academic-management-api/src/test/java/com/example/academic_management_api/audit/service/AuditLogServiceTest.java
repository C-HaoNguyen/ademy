package com.example.academic_management_api.audit.service;

import com.example.academic_management_api.audit.dto.AuditLogResponse;
import com.example.academic_management_api.audit.entity.AuditLog;
import com.example.academic_management_api.audit.repository.AuditLogRepository;
import com.example.academic_management_api.user.entity.Role;
import com.example.academic_management_api.user.entity.Users;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    private AuditLogService auditLogService;

    @BeforeEach
    void setUp() {
        auditLogService = new AuditLogService(auditLogRepository);
    }

    @Test
    void search_delegatesFiltersVerbatim_toRepository() {
        LocalDateTime from = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 1, 31, 23, 59);
        when(auditLogRepository.search(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        auditLogService.search("admin1", "ADMIN_USER_LOCK", "USER", from, to, 50);

        verify(auditLogRepository).search(eq("admin1"), eq("ADMIN_USER_LOCK"), eq("USER"), eq(from), eq(to), any());
    }

    @Test
    void search_nullLimit_usesDefault() {
        when(auditLogRepository.search(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        auditLogService.search(null, null, null, null, null, null);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(auditLogRepository).search(any(), any(), any(), any(), any(), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    void search_limitAboveMax_isClamped() {
        when(auditLogRepository.search(any(), any(), any(), any(), any(), any())).thenReturn(List.of());

        auditLogService.search(null, null, null, null, null, 100_000);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(auditLogRepository).search(any(), any(), any(), any(), any(), pageableCaptor.capture());
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(500);
    }

    @Test
    void search_mapsActorUserId_whenActorResolved() throws Exception {
        Users actor = new Users("admin1", "Admin One", "a1@example.com", "hash", Role.ADMIN);
        setUserId(actor, 7);

        AuditLog entry = new AuditLog();
        entry.setActor(actor);
        entry.setActorUsername("admin1");
        entry.setAction("ADMIN_USER_LOCK");
        entry.setTargetType("USER");
        entry.setTargetId("3");
        entry.setSuccess(true);

        when(auditLogRepository.search(any(), any(), any(), any(), any(), any())).thenReturn(List.of(entry));

        List<AuditLogResponse> result = auditLogService.search(null, null, null, null, null, null);

        assertThat(result).hasSize(1);
        AuditLogResponse dto = result.get(0);
        assertThat(dto.getActorUserId()).isEqualTo(7);
        assertThat(dto.getActorUsername()).isEqualTo("admin1");
        assertThat(dto.getAction()).isEqualTo("ADMIN_USER_LOCK");
        assertThat(dto.getTargetType()).isEqualTo("USER");
        assertThat(dto.getTargetId()).isEqualTo("3");
        assertThat(dto.isSuccess()).isTrue();
    }

    @Test
    void search_mapsActorUserIdAsNull_whenActorNotResolved() {
        AuditLog entry = new AuditLog();
        entry.setActor(null);
        entry.setActorUsername("unknown");
        entry.setAction("AUTH_LOGIN");
        entry.setSuccess(false);

        when(auditLogRepository.search(any(), any(), any(), any(), any(), any())).thenReturn(List.of(entry));

        List<AuditLogResponse> result = auditLogService.search(null, null, null, null, null, null);

        assertThat(result.get(0).getActorUserId()).isNull();
        assertThat(result.get(0).isSuccess()).isFalse();
    }

    private void setUserId(Users user, Integer id) throws Exception {
        Field field = Users.class.getDeclaredField("userId");
        field.setAccessible(true);
        field.set(user, id);
    }
}
