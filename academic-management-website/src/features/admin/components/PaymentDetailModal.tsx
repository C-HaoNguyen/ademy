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
    if (!payment) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Giao dịch #${payment.paymentId}`}
            size="sm"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Đóng
                </Button>
            }
        >
            <div>
                <DetailRow label="Học viên" value={payment.student?.fullName ?? "—"} />
                <DetailRow label="Khóa học" value={payment.course?.title ?? "—"} />
                <DetailRow label="Số tiền" value={formatCurrency(payment.amount)} />
                <DetailRow label="Phương thức" value={getPaymentMethodLabel(payment.paymentMethod)} />
                <DetailRow
                    label="Trạng thái"
                    value={
                        <Badge variant="status" tone={getPaymentStatusTone(payment.status)}>
                            {getPaymentStatusLabel(payment.status)}
                        </Badge>
                    }
                />
                <DetailRow
                    label="Ngày giao dịch"
                    value={new Date(payment.createdAt).toLocaleString("vi-VN")}
                />
            </div>
        </Modal>
    );
};

export default PaymentDetailModal;
