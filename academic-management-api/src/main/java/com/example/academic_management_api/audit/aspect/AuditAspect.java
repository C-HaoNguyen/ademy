package com.example.academic_management_api.audit.aspect;

import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.audit.service.AuditLogWriter;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.Ordered;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AOP aspect cho audit logging (ADR-012). Bắt mọi service method có {@link Audited}, ghi 1 bản
 * ghi audit qua {@link AuditLogWriter} sau khi method chạy xong — cả khi thành công lẫn thất bại.
 * <p>
 * Order thấp hơn (ưu tiên cao hơn) mặc định của transaction advisor
 * ({@code Ordered.LOWEST_PRECEDENCE}) một cách tường minh — bắt buộc để aspect này bọc NGOÀI
 * {@code @Transactional} của method đích. Nhờ vậy {@code pjp.proceed()} chỉ trả về (hoặc ném
 * exception) SAU KHI transaction của method đích đã commit/rollback xong, nên success/failure
 * quan sát được ở đây phản ánh đúng kết quả cuối cùng đã persist — không phải trạng thái tạm thời
 * giữa chừng transaction. Nếu ai đó sau này thêm cấu hình đổi order của transaction advisor, giá
 * trị ở đây cũng phải xem lại.
 */
@Aspect
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 1)
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);
    private static final String ANONYMOUS_PRINCIPAL = "anonymousUser";

    private final AuditLogWriter auditLogWriter;
    private final ParameterNameDiscoverer parameterNameDiscoverer = new DefaultParameterNameDiscoverer();
    private final ExpressionParser expressionParser = new SpelExpressionParser();
    // Expression string cố định tại call-site (annotation attribute, không dựng động theo request)
    // — parse 1 lần, tái dùng cho mọi lời gọi sau. Method @Audited chạy trên request path nóng
    // (login, checkout...), tránh parse lại SpEL mỗi lần gọi.
    private final Map<String, Expression> expressionCache = new ConcurrentHashMap<>();

    public AuditAspect(AuditLogWriter auditLogWriter) {
        this.auditLogWriter = auditLogWriter;
    }

    @Around("@annotation(audited)")
    public Object audit(ProceedingJoinPoint pjp, Audited audited) throws Throwable {
        Method method = ((MethodSignature) pjp.getSignature()).getMethod();
        StandardEvaluationContext context = buildParamContext(method, pjp.getArgs());
        String actorUsername = resolveActorUsername(audited, context);

        Object result;
        try {
            result = pjp.proceed();
        } catch (DataIntegrityViolationException t) {
            // Không ghi log ở đây nếu method tự khai suppressOnDataIntegrityViolation — pattern
            // "race condition, caller bắt và gọi method resolve/replay khác ở transaction mới"
            // (xem javadoc Audited.suppressOnDataIntegrityViolation). Method resolve/replay đó
            // phải tự audit kết quả thật của nó; ghi ở đây sẽ tạo 1 bản ghi "thất bại" giả cho 1
            // request thực ra đã thành công qua đường resolve.
            if (!audited.suppressOnDataIntegrityViolation()) {
                record(audited, actorUsername, context, null, false, t.getMessage());
            }
            throw t;
        } catch (Throwable t) {
            record(audited, actorUsername, context, null, false, t.getMessage());
            throw t;
        }

        boolean failed = isFailureResponse(result);
        String failureMessage = failed ? extractFailureMessage(result) : null;
        record(audited, actorUsername, context, result, !failed, failureMessage);
        return result;
    }

    private void record(
            Audited audited,
            String actorUsername,
            StandardEvaluationContext context,
            Object result,
            boolean success,
            String metadata
    ) {
        context.setVariable("result", result);
        String targetId = resolveTargetId(audited, context);
        auditLogWriter.write(actorUsername, audited.action(), audited.targetType(), targetId, success, metadata);
    }

    // Mặc định lấy actor từ SecurityContextHolder — thống nhất cho mọi method đã authenticated,
    // không phân biệt method đó có tự nhận username qua tham số hay không (tránh trộn 2 nguồn
    // actor khác nhau cho cùng 1 khái niệm). Chỉ dùng actorExpression khi actor CHƯA authenticate
    // tại thời điểm method chạy (case login — SecurityContextHolder rỗng lúc đó).
    private String resolveActorUsername(Audited audited, StandardEvaluationContext context) {
        if (!audited.actorExpression().isEmpty()) {
            Object value = evaluate(audited.actorExpression(), context, audited.action());
            return value != null ? value.toString() : "unknown";
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || ANONYMOUS_PRINCIPAL.equals(authentication.getPrincipal())) {
            return "unknown";
        }
        return authentication.getName();
    }

    private String resolveTargetId(Audited audited, StandardEvaluationContext context) {
        if (audited.targetIdExpression().isEmpty()) {
            return null;
        }
        Object value = evaluate(audited.targetIdExpression(), context, audited.action());
        return value != null ? value.toString() : null;
    }

    // SpEL đánh giá trên #result (chỉ có sau khi method chạy) có thể lỗi nếu method thất bại
    // trước khi tạo ra target, hoặc kết quả thất bại có shape khác kết quả thành công (vd login
    // thất bại trả body String thay vì AuditResponse có userId) — nuốt lỗi ở đây (mức debug, đây
    // là tình huống dự kiến chứ không phải lỗi), không để 1 targetId không resolve được làm mất
    // cả bản ghi audit log.
    private Object evaluate(String expressionString, StandardEvaluationContext context, String action) {
        try {
            Expression expression = expressionCache.computeIfAbsent(expressionString, expressionParser::parseExpression);
            return expression.getValue(context);
        } catch (Exception e) {
            log.debug("Không đánh giá được SpEL '{}' cho audited action '{}': {}", expressionString, action, e.getMessage());
            return null;
        }
    }

    private StandardEvaluationContext buildParamContext(Method method, Object[] args) {
        StandardEvaluationContext context = new StandardEvaluationContext();
        String[] paramNames = parameterNameDiscoverer.getParameterNames(method);
        if (paramNames != null) {
            for (int i = 0; i < paramNames.length; i++) {
                context.setVariable(paramNames[i], args[i]);
            }
        }
        return context;
    }

    // Nhiều method cũ (login, lockUser/unlockUser, createCourse/updateCourse...) trả
    // ResponseEntity.badRequest() thay vì throw exception khi thất bại nghiệp vụ — không bắt được
    // qua try/catch, phải tự kiểm tra status code của return value.
    private boolean isFailureResponse(Object result) {
        return result instanceof ResponseEntity<?> response && response.getStatusCode().isError();
    }

    private String extractFailureMessage(Object result) {
        if (result instanceof ResponseEntity<?> response) {
            Object body = response.getBody();
            return body != null ? body.toString() : response.getStatusCode().toString();
        }
        return null;
    }
}
