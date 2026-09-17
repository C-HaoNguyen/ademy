// Danh sách action đã biết, đối chiếu trực tiếp với mọi @Audited(action = "...") trong backend
// (audit/annotation/Audited.java sites) — backend không có endpoint liệt kê distinct actions nên
// đây là danh sách tĩnh. Nếu 1 phase sau thêm @Audited action mới, danh sách này cần cập nhật theo,
// không tự suy ra được. Label đi qua i18n (namespace "admin", key = action value) — xem
// locales/vi/admin.json#auditActions.
export const AUDIT_ACTION_VALUES: string[] = [
    "AUTH_LOGIN",
    "ADMIN_USER_LOCK",
    "ADMIN_USER_UNLOCK",
    "ADMIN_USER_DELETE",
    "ADMIN_COURSE_FORCE_UNPUBLISH",
    "ADMIN_ENROLLMENT_REVOKE_ACCESS",
    "ADMIN_COUPON_CREATE",
    "TEACHER_COURSE_CREATE",
    "TEACHER_COURSE_UPDATE",
    "TEACHER_COURSE_DELETE",
    "TEACHER_QUIZ_SAVE",
    "TEACHER_QUIZ_DELETE",
    "PAYMENT_CHECKOUT",
    "REFUND_REQUEST_CREATE",
    "REFUND_APPROVE",
    "REFUND_REJECT",
    "REFUND_MARK_COMPLETED",
];

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

export const getAuditActions = (t: TFunc): { value: string; label: string }[] =>
    AUDIT_ACTION_VALUES.map((value) => ({ value, label: getAuditActionLabel(value, t) }));

export const getAuditActionLabel = (action: string, t: TFunc) =>
    t(`admin:auditActions.${action}`, { defaultValue: action });
