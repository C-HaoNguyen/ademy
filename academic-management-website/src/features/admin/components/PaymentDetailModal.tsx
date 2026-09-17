import { useTranslation } from "react-i18next";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import DetailRow from "@/shared/ui/DetailRow";
import type { AdminPayment } from "@/shared/api/queries/useAdminPaymentsQuery";
import { getPaymentMethodLabel, getPaymentStatusLabel, getPaymentStatusTone, formatCurrency } from "@/features/admin/orders/paymentStatus";

interface PaymentDetailModalProps {
    open: boolean;
    onClose: () => void;
    payment: AdminPayment | null;
}

// UI_SPEC §5.5 — AdminOrders là read-only, click dòng mở Modal chi tiết (không phải trang riêng).
const PaymentDetailModal = ({ open, onClose, payment }: PaymentDetailModalProps) => {
    const { t } = useTranslation(["admin", "common"]);
    if (!payment) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t("paymentDetailModal.title", { id: payment.paymentId })}
            size="sm"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    {t("paymentDetailModal.close")}
                </Button>
            }
        >
            <div>
                <DetailRow label={t("paymentDetailModal.student")} value={payment.student?.fullName ?? "—"} />
                <DetailRow label={t("paymentDetailModal.course")} value={payment.course?.title ?? "—"} />
                <DetailRow label={t("paymentDetailModal.amount")} value={formatCurrency(payment.amount)} />
                <DetailRow label={t("paymentDetailModal.method")} value={getPaymentMethodLabel(payment.paymentMethod)} />
                <DetailRow
                    label={t("paymentDetailModal.status")}
                    value={
                        <Badge variant="status" tone={getPaymentStatusTone(payment.status)}>
                            {getPaymentStatusLabel(payment.status, t)}
                        </Badge>
                    }
                />
                <DetailRow
                    label={t("paymentDetailModal.createdAt")}
                    value={new Date(payment.createdAt).toLocaleString("vi-VN")}
                />
            </div>
        </Modal>
    );
};

export default PaymentDetailModal;
