import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

// businessStatus/executionStatus là 2 trục trạng thái tách biệt theo ADR-010 — không gộp chung 1
// badge. executionStatus chỉ có 2 giá trị thật ở backend (RefundExecutionStatus), không có trạng
// thái "đang xử lý" trung gian.
export type RefundBusinessStatus = "REQUESTED" | "APPROVED" | "REJECTED";
export type RefundExecutionStatus = "NOT_STARTED" | "MANUAL_COMPLETED";

export type AdminRefund = {
    id: number;
    paymentId: number;
    studentId: number;
    courseId: number;
    courseTitle: string;
    amount: number;
    reason: string;
    businessStatus: RefundBusinessStatus;
    adminNote: string | null;
    executionStatus: RefundExecutionStatus;
    gatewayRefundReference: string | null;
    requestedAt: string;
    decidedAt: string | null;
    completedAt: string | null;
};

export const adminRefundsQueryKey = ["admin", "refunds"] as const;

// Backend serialize RefundBusinessStatus/RefundExecutionStatus bằng @JsonValue name().toLowerCase()
// (payment/refund/entity/*.java) nên response thật là chữ thường — cùng kiểu lệch case đã fix ở
// useAdminCouponsQuery.ts. Chuẩn hóa chữ HOA ngay tại query hook để khớp type union hẹp.
export function useAdminRefundsQuery() {
    return useQuery({
        queryKey: adminRefundsQueryKey,
        queryFn: async (): Promise<AdminRefund[]> => {
            const res = await apiClient(API_ENDPOINTS.REFUNDS.ADMIN_LIST);

            if (!res.ok) {
                throw new Error(`Failed to load admin refund requests (${res.status})`);
            }

            const data = (await res.json()) as AdminRefund[];
            return data.map((refund) => ({
                ...refund,
                businessStatus: refund.businessStatus.toUpperCase() as RefundBusinessStatus,
                executionStatus: refund.executionStatus.toUpperCase() as RefundExecutionStatus,
            }));
        },
    });
}
