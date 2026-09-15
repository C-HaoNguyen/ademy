import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient, readErrorMessage } from "@/shared/api/client";
import { adminRefundsQueryKey, type AdminRefund } from "@/shared/api/queries/useAdminRefundsQuery";
import { useToast } from "@/shared/ui/useToast";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import FormField from "@/shared/ui/FormField";
import Textarea from "@/shared/ui/Textarea";
import DetailRow from "@/shared/ui/DetailRow";
import { formatCurrency } from "@/features/admin/orders/paymentStatus";
import {
    getBusinessStatusLabel,
    getBusinessStatusTone,
    getExecutionStatusLabel,
    getExecutionStatusTone,
} from "@/features/admin/refunds/refundStatus";

interface RefundDecisionModalProps {
    open: boolean;
    onClose: () => void;
    refund: AdminRefund | null;
    studentName: string;
}

// UI_SPEC §5.7 — Modal chi tiết với action "Duyệt"/"Từ chối" (REQUESTED) hoặc "Đánh dấu đã hoàn
// tiền" (APPROVED, chưa MANUAL_COMPLETED). Không có action nào tự động gọi cổng thanh toán (ADR-011
// — ManualRefundGateway là adapter duy nhất ở Phase 1).
// Mọi action ở đây đều là thay đổi trạng thái tài chính không thể hoàn tác (duyệt/từ chối/đánh dấu
// đã hoàn tiền) — cùng 1 bước xác nhận phụ trước khi gọi API, giống pattern các action phá hủy khác
// trong Admin (xóa category, vô hiệu hóa coupon, force-unpublish, thu hồi quyền truy cập).
type PendingAction = "REJECT" | "APPROVE" | "COMPLETE" | null;

const RefundDecisionModal = ({ open, onClose, refund, studentName }: RefundDecisionModalProps) => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setPendingAction(null);
        setReason("");
        setReasonError(undefined);
    }, [open, refund?.id]);

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const runAction = async (path: string, body?: unknown) => {
        setSubmitting(true);
        try {
            const res = await apiClient(path, {
                method: "POST",
                ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
            });

            if (!res.ok) {
                const message = await readErrorMessage(res, "Thao tác thất bại");
                showToast({ tone: "danger", message });
                return false;
            }

            queryClient.invalidateQueries({ queryKey: adminRefundsQueryKey });
            return true;
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    if (!refund) return null;

    const handleApprove = async () => {
        const ok = await runAction(API_ENDPOINTS.REFUNDS.APPROVE(refund.id));
        if (ok) {
            showToast({ tone: "success", message: "Đã duyệt yêu cầu hoàn tiền" });
            onClose();
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            setReasonError("Vui lòng nhập lý do từ chối");
            return;
        }
        const ok = await runAction(API_ENDPOINTS.REFUNDS.REJECT(refund.id), { reason });
        if (ok) {
            showToast({ tone: "success", message: "Đã từ chối yêu cầu hoàn tiền" });
            onClose();
        }
    };

    const handleMarkCompleted = async () => {
        const ok = await runAction(API_ENDPOINTS.REFUNDS.MARK_COMPLETED(refund.id));
        if (ok) {
            showToast({ tone: "success", message: "Đã đánh dấu hoàn tiền thành công" });
            onClose();
        }
    };

    const canDecide = refund.businessStatus === "REQUESTED";
    const canMarkCompleted = refund.businessStatus === "APPROVED" && refund.executionStatus === "NOT_STARTED";

    return (
        <Modal
            open={open}
            onClose={handleClose}
            closeDisabled={submitting}
            title={`Yêu cầu hoàn tiền #${refund.id}`}
            size="md"
            footer={
                pendingAction === "REJECT" ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={submitting}>
                            Quay lại
                        </Button>
                        <Button variant="danger" onClick={handleReject} loading={submitting}>
                            Xác nhận từ chối
                        </Button>
                    </>
                ) : pendingAction === "APPROVE" ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={submitting}>
                            Quay lại
                        </Button>
                        <Button variant="primary" onClick={handleApprove} loading={submitting}>
                            Xác nhận duyệt
                        </Button>
                    </>
                ) : pendingAction === "COMPLETE" ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={submitting}>
                            Quay lại
                        </Button>
                        <Button variant="primary" onClick={handleMarkCompleted} loading={submitting}>
                            Xác nhận đã hoàn tiền
                        </Button>
                    </>
                ) : canDecide ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction("REJECT")} disabled={submitting}>
                            Từ chối
                        </Button>
                        <Button variant="primary" onClick={() => setPendingAction("APPROVE")} disabled={submitting}>
                            Duyệt
                        </Button>
                    </>
                ) : canMarkCompleted ? (
                    <>
                        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                            Đóng
                        </Button>
                        <Button variant="primary" onClick={() => setPendingAction("COMPLETE")} disabled={submitting}>
                            Đánh dấu đã hoàn tiền
                        </Button>
                    </>
                ) : (
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                )
            }
        >
            {pendingAction === "REJECT" ? (
                <FormField label="Lý do từ chối" required error={reasonError}>
                    <Textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (reasonError) setReasonError(undefined);
                        }}
                        placeholder="Mô tả lý do từ chối yêu cầu hoàn tiền"
                    />
                </FormField>
            ) : pendingAction === "APPROVE" ? (
                <p className="text-body text-secondary">
                    Duyệt yêu cầu hoàn tiền <span className="font-semibold text-primary">#{refund.id}</span> của{" "}
                    <span className="font-semibold text-primary">{studentName}</span>? Sau khi duyệt, bạn sẽ cần đánh
                    dấu đã hoàn tiền thủ công sau khi thực hiện chuyển khoản ngoài hệ thống.
                </p>
            ) : pendingAction === "COMPLETE" ? (
                <p className="text-body text-secondary">
                    Xác nhận đã hoàn tiền thủ công{" "}
                    <span className="font-semibold text-primary">{formatCurrency(refund.amount)}</span> cho{" "}
                    <span className="font-semibold text-primary">{studentName}</span>? Chỉ xác nhận sau khi đã thực
                    sự chuyển khoản — hành động này không thể hoàn tác.
                </p>
            ) : (
                <div>
                    <DetailRow label="Học viên" value={studentName} />
                    <DetailRow label="Khóa học" value={refund.courseTitle} />
                    <DetailRow label="Số tiền" value={formatCurrency(refund.amount)} />
                    <DetailRow label="Lý do" value={refund.reason} />
                    <DetailRow
                        label="Trạng thái nghiệp vụ"
                        value={
                            <Badge variant="status" tone={getBusinessStatusTone(refund.businessStatus)}>
                                {getBusinessStatusLabel(refund.businessStatus)}
                            </Badge>
                        }
                    />
                    <DetailRow
                        label="Trạng thái xử lý"
                        value={
                            <Badge variant="status" tone={getExecutionStatusTone(refund.executionStatus)}>
                                {getExecutionStatusLabel(refund.executionStatus)}
                            </Badge>
                        }
                    />
                    {refund.adminNote && <DetailRow label="Ghi chú Admin" value={refund.adminNote} />}
                    <DetailRow label="Ngày yêu cầu" value={new Date(refund.requestedAt).toLocaleString("vi-VN")} />
                </div>
            )}
        </Modal>
    );
};

export default RefundDecisionModal;
