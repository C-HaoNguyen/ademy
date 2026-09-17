import { useMemo, useState } from "react";
import { Receipt, ReceiptText, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAdminPaymentsQuery, type AdminPayment } from "@/shared/api/queries/useAdminPaymentsQuery";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn } from "@/shared/ui/Table";
import PaymentDetailModal from "@/features/admin/components/PaymentDetailModal";
import { getPaymentMethodLabel, getPaymentStatusLabel, getPaymentStatusTone, formatCurrency } from "@/features/admin/orders/paymentStatus";

type StatusFilter = "ALL" | "PENDING" | "SUCCESS" | "FAILED";

const AdminOrders = () => {
    const { t } = useTranslation(["admin", "common"]);
    const paymentsQuery = useAdminPaymentsQuery();

    const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
        { key: "ALL", label: t("orders.filterAll") },
        { key: "PENDING", label: t("common:paymentStatus.pending") },
        { key: "SUCCESS", label: t("common:paymentStatus.success") },
        { key: "FAILED", label: t("common:paymentStatus.failed") },
    ];

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
            header: t("orders.columnStudent"),
            render: (payment) => payment.student?.fullName ?? "—",
        },
        {
            key: "course",
            header: t("orders.columnCourse"),
            render: (payment) => payment.course?.title ?? "—",
        },
        {
            key: "amount",
            header: t("orders.columnAmount"),
            render: (payment) => <span className="font-medium text-primary">{formatCurrency(payment.amount)}</span>,
        },
        {
            key: "paymentMethod",
            header: t("orders.columnMethod"),
            render: (payment) => getPaymentMethodLabel(payment.paymentMethod),
        },
        {
            key: "status",
            header: t("orders.columnStatus"),
            render: (payment) => (
                <Badge variant="status" tone={getPaymentStatusTone(payment.status)}>
                    {getPaymentStatusLabel(payment.status, t)}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: t("orders.columnCreatedAt"),
            render: (payment) => new Date(payment.createdAt).toLocaleDateString("vi-VN"),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="flex items-center gap-3 text-h2 text-primary">
                    <Receipt size={24} aria-hidden="true" />
                    {t("orders.title")}
                </h2>
                <p className="text-body-sm text-secondary mt-1">
                    {t("orders.subtitle")}
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

            {paymentsQuery.isError ? (
                <EmptyState
                    icon={AlertTriangle}
                    title={t("orders.loadErrorTitle")}
                    description={t("orders.loadErrorDescription")}
                    action={
                        <Button variant="primary" size="sm" onClick={() => paymentsQuery.refetch()}>
                            {t("orders.retry")}
                        </Button>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    data={filteredPayments}
                    rowKey={(payment) => payment.paymentId}
                    loading={paymentsQuery.isLoading}
                    onRowClick={(payment) => setSelectedPayment(payment)}
                    emptyState={<EmptyState icon={ReceiptText} title={t("orders.emptyTitle")} />}
                />
            )}

            <PaymentDetailModal
                open={selectedPayment !== null}
                onClose={() => setSelectedPayment(null)}
                payment={selectedPayment}
            />
        </div>
    );
};

export default AdminOrders;
