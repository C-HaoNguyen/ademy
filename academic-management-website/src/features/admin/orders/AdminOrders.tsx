import { useMemo, useState } from "react";
import { Receipt, ReceiptText } from "lucide-react";
import { useAdminPaymentsQuery, type AdminPayment } from "@/shared/api/queries/useAdminPaymentsQuery";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn } from "@/shared/ui/Table";
import PaymentDetailModal from "@/features/admin/components/PaymentDetailModal";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE, formatCurrency } from "@/features/admin/orders/paymentStatus";

type StatusFilter = "ALL" | "PENDING" | "SUCCESS" | "FAILED";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Đang xử lý" },
    { key: "SUCCESS", label: "Thành công" },
    { key: "FAILED", label: "Thất bại" },
];

const AdminOrders = () => {
    const paymentsQuery = useAdminPaymentsQuery();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

    const filteredPayments = useMemo(() => {
        const payments = paymentsQuery.data ?? [];
        if (statusFilter === "ALL") return payments;
        return payments.filter((p) => p.status?.toUpperCase() === statusFilter);
    }, [paymentsQuery.data, statusFilter]);

    const columns: TableColumn<AdminPayment>[] = [
        {
            key: "student",
            header: "Học viên",
            render: (payment) => payment.student?.fullName ?? "—",
        },
        {
            key: "course",
            header: "Khóa học",
            render: (payment) => payment.course?.title ?? "—",
        },
        {
            key: "amount",
            header: "Số tiền",
            render: (payment) => <span className="font-medium text-primary">{formatCurrency(payment.amount)}</span>,
        },
        {
            key: "paymentMethod",
            header: "Phương thức",
            render: (payment) => PAYMENT_METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod ?? "—",
        },
        {
            key: "status",
            header: "Trạng thái",
            render: (payment) => (
                <Badge variant="status" tone={PAYMENT_STATUS_TONE[payment.status] ?? "info"}>
                    {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Ngày giao dịch",
            render: (payment) => new Date(payment.createdAt).toLocaleDateString("vi-VN"),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="flex items-center gap-3 text-h2 text-primary">
                    <Receipt size={24} aria-hidden="true" />
                    Quản lý đơn thanh toán
                </h2>
                <p className="text-body-sm text-secondary mt-1">
                    Xem toàn bộ giao dịch thanh toán trên nền tảng — chỉ xem, xử lý hoàn tiền ở trang Refunds.
                </p>
            </div>

            <div className="flex items-center gap-2">
                {STATUS_FILTERS.map((filter) => (
                    <Button
                        key={filter.key}
                        variant={statusFilter === filter.key ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setStatusFilter(filter.key)}
                    >
                        {filter.label}
                    </Button>
                ))}
            </div>

            <Table
                columns={columns}
                data={filteredPayments}
                rowKey={(payment) => payment.paymentId}
                loading={paymentsQuery.isLoading}
                onRowClick={(payment) => setSelectedPayment(payment)}
                emptyState={<EmptyState icon={ReceiptText} title="Chưa có đơn thanh toán nào" />}
            />

            <PaymentDetailModal
                open={selectedPayment !== null}
                onClose={() => setSelectedPayment(null)}
                payment={selectedPayment}
            />
        </div>
    );
};

export default AdminOrders;
