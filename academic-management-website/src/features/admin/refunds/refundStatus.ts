// Badge tone/label dùng chung giữa AdminRefunds.tsx và RefundDecisionModal.tsx (cùng convention
// paymentStatus.ts). 2 trục trạng thái tách biệt theo ADR-010 — businessStatus (nghiệp vụ) và
// executionStatus (xử lý hoàn tiền thủ công) không được gộp chung 1 badge.
import type { RefundBusinessStatus, RefundExecutionStatus } from "@/shared/api/queries/useAdminRefundsQuery";

const BUSINESS_STATUS_TONE: Record<RefundBusinessStatus, "success" | "warning" | "danger"> = {
    REQUESTED: "warning",
    APPROVED: "success",
    REJECTED: "danger",
};

const BUSINESS_STATUS_LABEL: Record<RefundBusinessStatus, string> = {
    REQUESTED: "Đang chờ",
    APPROVED: "Đã duyệt",
    REJECTED: "Đã từ chối",
};

// executionStatus chỉ có 2 giá trị thật ở backend (RefundExecutionStatus) — không có trạng thái
// "đang xử lý" trung gian như REFACTOR_PLAN.md/UI_SPEC ngầm định ban đầu.
const EXECUTION_STATUS_TONE: Record<RefundExecutionStatus, "info" | "success"> = {
    NOT_STARTED: "info",
    MANUAL_COMPLETED: "success",
};

const EXECUTION_STATUS_LABEL: Record<RefundExecutionStatus, string> = {
    NOT_STARTED: "Chưa xử lý",
    MANUAL_COMPLETED: "Đã hoàn tất",
};

export const getBusinessStatusTone = (status: RefundBusinessStatus) => BUSINESS_STATUS_TONE[status];
export const getBusinessStatusLabel = (status: RefundBusinessStatus) => BUSINESS_STATUS_LABEL[status];
export const getExecutionStatusTone = (status: RefundExecutionStatus) => EXECUTION_STATUS_TONE[status];
export const getExecutionStatusLabel = (status: RefundExecutionStatus) => EXECUTION_STATUS_LABEL[status];
