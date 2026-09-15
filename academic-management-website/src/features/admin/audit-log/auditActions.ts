// Danh sách action đã biết, đối chiếu trực tiếp với mọi @Audited(action = "...") trong backend
// (audit/annotation/Audited.java sites) — backend không có endpoint liệt kê distinct actions nên
// đây là danh sách tĩnh. Nếu 1 phase sau thêm @Audited action mới, danh sách này cần cập nhật theo,
// không tự suy ra được.
export const AUDIT_ACTIONS: { value: string; label: string }[] = [
    { value: "AUTH_LOGIN", label: "Đăng nhập" },
    { value: "ADMIN_USER_LOCK", label: "Khóa tài khoản" },
    { value: "ADMIN_USER_UNLOCK", label: "Mở khóa tài khoản" },
    { value: "ADMIN_USER_DELETE", label: "Xóa tài khoản" },
    { value: "ADMIN_COURSE_FORCE_UNPUBLISH", label: "Force-unpublish khóa học" },
    { value: "ADMIN_ENROLLMENT_REVOKE_ACCESS", label: "Thu hồi quyền truy cập" },
    { value: "ADMIN_COUPON_CREATE", label: "Tạo coupon" },
    { value: "TEACHER_COURSE_CREATE", label: "Teacher tạo khóa học" },
    { value: "TEACHER_COURSE_UPDATE", label: "Teacher sửa khóa học" },
    { value: "TEACHER_COURSE_DELETE", label: "Teacher xóa khóa học" },
    { value: "TEACHER_QUIZ_SAVE", label: "Teacher lưu quiz" },
    { value: "TEACHER_QUIZ_DELETE", label: "Teacher xóa quiz" },
    { value: "PAYMENT_CHECKOUT", label: "Thanh toán checkout" },
    { value: "REFUND_REQUEST_CREATE", label: "Yêu cầu hoàn tiền" },
    { value: "REFUND_APPROVE", label: "Duyệt hoàn tiền" },
    { value: "REFUND_REJECT", label: "Từ chối hoàn tiền" },
    { value: "REFUND_MARK_COMPLETED", label: "Đánh dấu đã hoàn tiền" },
];

const AUDIT_ACTION_LABEL: Record<string, string> = Object.fromEntries(
    AUDIT_ACTIONS.map((a) => [a.value, a.label])
);

export const getAuditActionLabel = (action: string) => AUDIT_ACTION_LABEL[action] ?? action;
