import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation(["admin", "common"]);
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
                const message = await readErrorMessage(res, t("refundDecisionModal.actionFailed"));
                showToast({ tone: "danger", message });
                return false;
            }

            queryClient.invalidateQueries({ queryKey: adminRefundsQueryKey });
            return true;
        } catch {
            showToast({ tone: "danger", message: t("refundDecisionModal.connectionError") });
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    if (!refund) return null;

    const handleApprove = async () => {
        const ok = await runAction(API_ENDPOINTS.REFUNDS.APPROVE(refund.id));
        if (ok) {
            showToast({ tone: "success", message: t("refundDecisionModal.approved") });
            onClose();
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            setReasonError(t("refundDecisionModal.reasonRequired"));
            return;
        }
        const ok = await runAction(API_ENDPOINTS.REFUNDS.REJECT(refund.id), { reason });
        if (ok) {
            showToast({ tone: "success", message: t("refundDecisionModal.rejected") });
            onClose();
        }
    };

    const handleMarkCompleted = async () => {
        const ok = await runAction(API_ENDPOINTS.REFUNDS.MARK_COMPLETED(refund.id));
        if (ok) {
            showToast({ tone: "success", message: t("refundDecisionModal.markedCompleted") });
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
            title={t("refundDecisionModal.title", { id: refund.id })}
            size="md"
            footer={
                pendingAction === "REJECT" ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={submitting}>
                            {t("refundDecisionModal.back")}
                        </Button>
                        <Button variant="danger" onClick={handleReject} loading={submitting}>
                            {t("refundDecisionModal.confirmReject")}
                        </Button>
                    </>
                ) : pendingAction === "APPROVE" ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={submitting}>
                            {t("refundDecisionModal.back")}
                        </Button>
                        <Button variant="primary" onClick={handleApprove} loading={submitting}>
                            {t("refundDecisionModal.confirmApprove")}
                        </Button>
                    </>
                ) : pendingAction === "COMPLETE" ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction(null)} disabled={submitting}>
                            {t("refundDecisionModal.back")}
                        </Button>
                        <Button variant="primary" onClick={handleMarkCompleted} loading={submitting}>
                            {t("refundDecisionModal.confirmComplete")}
                        </Button>
                    </>
                ) : canDecide ? (
                    <>
                        <Button variant="secondary" onClick={() => setPendingAction("REJECT")} disabled={submitting}>
                            {t("refundDecisionModal.reject")}
                        </Button>
                        <Button variant="primary" onClick={() => setPendingAction("APPROVE")} disabled={submitting}>
                            {t("refundDecisionModal.approve")}
                        </Button>
                    </>
                ) : canMarkCompleted ? (
                    <>
                        <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                            {t("refundDecisionModal.close")}
                        </Button>
                        <Button variant="primary" onClick={() => setPendingAction("COMPLETE")} disabled={submitting}>
                            {t("refundDecisionModal.markCompleted")}
                        </Button>
                    </>
                ) : (
                    <Button variant="secondary" onClick={handleClose}>
                        {t("refundDecisionModal.close")}
                    </Button>
                )
            }
        >
            {pendingAction === "REJECT" ? (
                <FormField label={t("refundDecisionModal.rejectReasonLabel")} required error={reasonError}>
                    <Textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (reasonError) setReasonError(undefined);
                        }}
                        placeholder={t("refundDecisionModal.rejectReasonPlaceholder")}
                    />
                </FormField>
            ) : pendingAction === "APPROVE" ? (
                <p className="text-body text-secondary">
                    {t("refundDecisionModal.approveConfirmPrefix")} <span className="font-semibold text-primary">#{refund.id}</span> {t("refundDecisionModal.approveConfirmOf")}{" "}
                    <span className="font-semibold text-primary">{studentName}</span>{t("refundDecisionModal.approveConfirmSuffix")}
                </p>
            ) : pendingAction === "COMPLETE" ? (
                <p className="text-body text-secondary">
                    {t("refundDecisionModal.completeConfirmPrefix")}{" "}
                    <span className="font-semibold text-primary">{formatCurrency(refund.amount)}</span> {t("refundDecisionModal.completeConfirmFor")}{" "}
                    <span className="font-semibold text-primary">{studentName}</span>{t("refundDecisionModal.completeConfirmSuffix")}
                </p>
            ) : (
                <div>
                    <DetailRow label={t("refundDecisionModal.detailStudent")} value={studentName} />
                    <DetailRow label={t("refundDecisionModal.detailCourse")} value={refund.courseTitle} />
                    <DetailRow label={t("refundDecisionModal.detailAmount")} value={formatCurrency(refund.amount)} />
                    <DetailRow label={t("refundDecisionModal.detailReason")} value={refund.reason} />
                    <DetailRow
                        label={t("refundDecisionModal.detailBusinessStatus")}
                        value={
                            <Badge variant="status" tone={getBusinessStatusTone(refund.businessStatus)}>
                                {getBusinessStatusLabel(refund.businessStatus, t)}
                            </Badge>
                        }
                    />
                    <DetailRow
                        label={t("refundDecisionModal.detailExecutionStatus")}
                        value={
                            <Badge variant="status" tone={getExecutionStatusTone(refund.executionStatus)}>
                                {getExecutionStatusLabel(refund.executionStatus, t)}
                            </Badge>
                        }
                    />
                    {refund.adminNote && <DetailRow label={t("refundDecisionModal.detailAdminNote")} value={refund.adminNote} />}
                    <DetailRow label={t("refundDecisionModal.detailRequestedAt")} value={new Date(refund.requestedAt).toLocaleString("vi-VN")} />
                </div>
            )}
        </Modal>
    );
};

export default RefundDecisionModal;
