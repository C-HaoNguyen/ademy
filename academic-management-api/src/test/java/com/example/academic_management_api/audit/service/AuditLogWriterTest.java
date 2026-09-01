package com.example.academic_management_api.audit.service;

import com.example.academic_management_api.audit.entity.AuditLog;
import com.example.academic_management_api.audit.repository.AuditLogRepository;
import com.example.academic_management_api.user.entity.Role;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogWriterTest {

    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private UserService userService;

    private AuditLogWriter auditLogWriter;

    @BeforeEach
    void setUp() {
        auditLogWriter = new AuditLogWriter(auditLogRepository, userService);
    }

    @Test
    void write_resolvesActorEntity_andPersistsAllFields() {
        Users actor = new Users("teacher1", "Teacher One", "t1@example.com", "hash", Role.TEACHER);
        when(userService.findByUsername("teacher1")).thenReturn(Optional.of(actor));

        auditLogWriter.write("teacher1", "TEACHER_COURSE_UPDATE", "COURSE", "5", true, null);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();

        assertThat(saved.getActor()).isEqualTo(actor);
        assertThat(saved.getActorUsername()).isEqualTo("teacher1");
        assertThat(saved.getAction()).isEqualTo("TEACHER_COURSE_UPDATE");
        assertThat(saved.getTargetType()).isEqualTo("COURSE");
        assertThat(saved.getTargetId()).isEqualTo("5");
        assertThat(saved.isSuccess()).isTrue();
        assertThat(saved.getMetadata()).isNull();
    }

    @Test
    void write_actorNotResolvable_stillPersists_withNullActorEntity() {
        when(userService.findByUsername("ghost")).thenReturn(Optional.empty());

        auditLogWriter.write("ghost", "AUTH_LOGIN", "USER", null, false, "Sai mật khẩu");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();

        assertThat(saved.getActor()).isNull();
        assertThat(saved.getActorUsername()).isEqualTo("ghost");
        assertThat(saved.isSuccess()).isFalse();
        assertThat(saved.getMetadata()).isEqualTo("Sai mật khẩu");
    }

    @Test
    void write_repositoryThrows_isSwallowed_doesNotPropagate() {
        when(userService.findByUsername(anyString())).thenReturn(Optional.empty());
        doThrow(new RuntimeException("DB down")).when(auditLogRepository).save(any());

        assertThatCode(() -> auditLogWriter.write("teacher1", "TEACHER_COURSE_UPDATE", "COURSE", "5", true, null))
                .doesNotThrowAnyException();
    }

    // Username thử đăng nhập không có @Size validation nào chặn (LoginRequest chỉ @NotBlank) —
    // actor_username là varchar(50) not null, phải tự chặn ở đây, không để lần thử đáng ngờ nhất
    // (username dài bất thường/dò brute-force) bị mất audit log vì save() ném
    // DataIntegrityViolationException và bị catch(Exception) nuốt mất.
    @Test
    void write_actorUsernameLongerThanColumn_isTruncated_notSwallowedAsError() {
        String longUsername = "a".repeat(80);
        when(userService.findByUsername(longUsername)).thenReturn(Optional.empty());

        auditLogWriter.write(longUsername, "AUTH_LOGIN", "USER", null, false, "Không tìm thấy người dùng");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getActorUsername()).hasSize(50);
        assertThat(captor.getValue().getActorUsername()).isEqualTo("a".repeat(50));
    }

    @Test
    void write_targetIdLongerThanColumn_isTruncated() {
        when(userService.findByUsername(anyString())).thenReturn(Optional.empty());
        String longTargetId = "9".repeat(80);

        auditLogWriter.write("teacher1", "TEACHER_COURSE_UPDATE", "COURSE", longTargetId, true, null);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getTargetId()).hasSize(50);
    }
}
