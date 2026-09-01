package com.example.academic_management_api.audit.aspect;

import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.audit.service.AuditLogWriter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.aop.aspectj.annotation.AspectJProxyFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

// Test AOP thật (không phải chỉ gọi thẳng method Java) qua AspectJProxyFactory — vẫn không cần
// Spring context/DB (giữ đúng tiền lệ Mockito thuần của mọi test khác trong dự án), nhưng verify
// đúng hành vi weaving @Around thật thay vì chỉ test logic tách rời khỏi cơ chế proxy.
@ExtendWith(MockitoExtension.class)
class AuditAspectTest {

    @Mock
    private AuditLogWriter auditLogWriter;

    private TargetService proxy;

    @BeforeEach
    void setUp() {
        AuditAspect aspect = new AuditAspect(auditLogWriter);
        AspectJProxyFactory factory = new AspectJProxyFactory(new TargetServiceImpl());
        factory.addAspect(aspect);
        proxy = factory.getProxy();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void success_readsActorFromSecurityContext_andRecordsSuccessTrue() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher1", null, List.of()));

        proxy.createThing(42);

        verify(auditLogWriter).write("teacher1", "THING_CREATE", "THING", "42", true, null);
    }

    @Test
    void unauthenticatedContext_recordsActorAsUnknown() {
        proxy.createThing(1);

        verify(auditLogWriter).write("unknown", "THING_CREATE", "THING", "1", true, null);
    }

    @Test
    void exceptionThrown_recordsSuccessFalse_andRethrows() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher1", null, List.of()));

        assertThatThrownBy(() -> proxy.failWithException(7))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("boom");

        verify(auditLogWriter).write("teacher1", "THING_FAIL", "THING", "7", false, "boom");
    }

    @Test
    void responseEntityErrorStatus_withoutException_recordsSuccessFalse() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin1", null, List.of()));

        ResponseEntity<?> result = proxy.badRequestNoException();

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(auditLogWriter).write("admin1", "THING_BADREQUEST", "THING", null, false, "lỗi nghiệp vụ");
    }

    @Test
    void responseEntityOkStatus_recordsSuccessTrue() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin1", null, List.of()));

        proxy.okResponse();

        verify(auditLogWriter).write("admin1", "THING_OK", "THING", null, true, null);
    }

    @Test
    void actorExpression_overridesSecurityContext_forUnauthenticatedCase() {
        // Không set Authentication nào — mô phỏng đúng case login: actor phải đến từ tham số, không
        // phải SecurityContextHolder.
        proxy.loginLike("alice", false);

        verify(auditLogWriter).write("alice", "LOGIN_LIKE", "USER", null, true, null);
    }

    @Test
    void targetIdExpression_onResult_resolvesAfterProceed() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher1", null, List.of()));

        proxy.createAndReturnId(99);

        verify(auditLogWriter).write("teacher1", "THING_CREATE_RETURN_ID", "THING", "99", true, null);
    }

    // Race condition dự kiến (idempotency-key/unique constraint đồng thời) — method resolve/replay
    // ở transaction mới mới là nơi audit kết quả thật, không log "thất bại" giả ở đây.
    @Test
    void dataIntegrityViolation_withSuppressFlag_doesNotRecord_butStillRethrows() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher1", null, List.of()));

        assertThatThrownBy(() -> proxy.raceConditionSuppressed(5))
                .isInstanceOf(DataIntegrityViolationException.class);

        verifyNoInteractions(auditLogWriter);
    }

    // Không set suppressOnDataIntegrityViolation — DataIntegrityViolationException ở đây là 1 lỗi
    // thật (vd FK violation), phải audit như mọi exception khác.
    @Test
    void dataIntegrityViolation_withoutSuppressFlag_recordsFailure() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("teacher1", null, List.of()));

        assertThatThrownBy(() -> proxy.raceConditionNotSuppressed(6))
                .isInstanceOf(DataIntegrityViolationException.class);

        verify(auditLogWriter).write("teacher1", "THING_FK_VIOLATION", "THING", "6", false, "fk violation");
    }

    interface TargetService {
        void createThing(Integer id);

        void failWithException(Integer id);

        ResponseEntity<?> badRequestNoException();

        ResponseEntity<?> okResponse();

        void loginLike(String username, boolean shouldFail);

        Integer createAndReturnId(Integer id);

        void raceConditionSuppressed(Integer id);

        void raceConditionNotSuppressed(Integer id);
    }

    static class TargetServiceImpl implements TargetService {

        @Override
        @Audited(action = "THING_CREATE", targetType = "THING", targetIdExpression = "#id")
        public void createThing(Integer id) {
            // no-op, đại diện 1 hành động thành công không throw, không trả ResponseEntity
        }

        @Override
        @Audited(action = "THING_FAIL", targetType = "THING", targetIdExpression = "#id")
        public void failWithException(Integer id) {
            throw new IllegalStateException("boom");
        }

        @Override
        @Audited(action = "THING_BADREQUEST", targetType = "THING")
        public ResponseEntity<?> badRequestNoException() {
            return ResponseEntity.badRequest().body("lỗi nghiệp vụ");
        }

        @Override
        @Audited(action = "THING_OK", targetType = "THING")
        public ResponseEntity<?> okResponse() {
            return ResponseEntity.ok("ok");
        }

        @Override
        @Audited(action = "LOGIN_LIKE", targetType = "USER", actorExpression = "#username")
        public void loginLike(String username, boolean shouldFail) {
            if (shouldFail) {
                throw new IllegalStateException("bad credentials");
            }
        }

        @Override
        @Audited(action = "THING_CREATE_RETURN_ID", targetType = "THING", targetIdExpression = "#result")
        public Integer createAndReturnId(Integer id) {
            return id;
        }

        @Override
        @Audited(
                action = "THING_RACE",
                targetType = "THING",
                targetIdExpression = "#id",
                suppressOnDataIntegrityViolation = true
        )
        public void raceConditionSuppressed(Integer id) {
            throw new DataIntegrityViolationException("duplicate key");
        }

        @Override
        @Audited(action = "THING_FK_VIOLATION", targetType = "THING", targetIdExpression = "#id")
        public void raceConditionNotSuppressed(Integer id) {
            throw new DataIntegrityViolationException("fk violation");
        }
    }
}
