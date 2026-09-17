import { useMemo, useState } from "react";
import { RotateCcw, Inbox, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAdminRefundsQuery, type AdminRefund, type RefundBusinessStatus } from "@/shared/api/queries/useAdminRefundsQuery";
import { useAdminUsersQuery } from "@/shared/api/queries/useAdminUsersQuery";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn } from "@/shared/ui/Table";
import RefundDecisionModal from "@/features/admin/components/RefundDecisionModal";
import { formatCurrency } from "@/features/admin/orders/paymentStatus";
import {
    getBusinessStatusLabel,
    getBusinessStatusTone,
    getExecutionStatusLabel,
    getExecutionStatusTone,
} from "@/features/admin/refunds/refundStatus";

type StatusFilter = "ALL" | RefundBusinessStatus;

const AdminRefunds = () => {
    const { t } = useTranslation(["admin", "common"]);
    const refundsQuery = useAdminRefundsQuery();

    const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
        { key: "ALL", label: t("refunds.filterAll") },
        { key: "REQUESTED", label: t("common:refundBusinessStatus.requested") },
        { key: "APPROVED", label: t("common:refundBusinessStatus.approved") },
        { key: "REJECTED", label: t("common:refundBusinessStatus.rejected") },
    ];
    const usersQuery = useAdminUsersQuery();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [selectedRefund, setSelectedRefund] = useState<AdminRefund | null>(null);

    const studentNameById = useMemo(() => {
        const map = new Map<number, string>();
        (usersQuery.data ?? []).forEach((u) => map.set(u.userId, u.fullName));
        return map;
    }, [usersQuery.data]);

    const getStudentName = (studentId: number) => studentNameById.get(studentId) ?? `#${studentId}`;

    const filteredRefunds = useMemo(() => {
        const refunds = refundsQuery.data ?? [];
        if (statusFilter === "ALL") return refunds;
        return refunds.filter((r) => r.businessStatus === statusFilter);
    }, [refundsQuery.data, statusFilter]);

    const columns: TableColumn<AdminRefund>[] = [
        {
            key: "student",
            header: t("refunds.columnStudent"),
            render: (refund) => getStudentName(refund.studentId),
        },
        {
            key: "course",
            header: t("refunds.columnCourse"),
            render: (refund) => refund.courseTitle,
        },
        {
            key: "amount",
            header: t("refunds.columnAmount"),
            render: (refund) => <span className="font-medium text-primary">{formatCurrency(refund.amount)}</span>,
        },
        {
            key: "reason",
            header: t("refunds.columnReason"),
            render: (refund) => <span className="line-clamp-1 max-w-xs">{refund.reason}</span>,
        },
        {
            key: "requestedAt",
            header: t("refunds.columnRequestedAt"),
            render: (refund) => new Date(refund.requestedAt).toLocaleDateString("vi-VN"),
        },
        {
            key: "businessStatus",
            header: t("refunds.columnBusinessStatus"),
            render: (refund) => (
                <Badge variant="status" tone={getBusinessStatusTone(refund.businessStatus)}>
                    {getBusinessStatusLabel(refund.businessStatus, t)}
                </Badge>
            ),
        },
        {
            key: "executionStatus",
            header: t("refunds.columnExecutionStatus"),
            render: (refund) => (
                <Badge variant="status" tone={getExecutionStatusTone(refund.executionStatus)}>
                    {getExecutionStatusLabel(refund.executionStatus, t)}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="flex items-center gap-3 text-h2 text-primary">
                    <RotateCcw size={24} aria-hidden="true" />
                    {t("refunds.title")}
                </h2>
                <p className="text-body-sm text-secondary mt-1">
                    {t("refunds.subtitle")}
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

            {refundsQuery.isError ? (
                <EmptyState
                    icon={AlertTriangle}
                    title={t("refunds.loadErrorTitle")}
                    description={t("refunds.loadErrorDescription")}
                    action={
                        <Button variant="primary" size="sm" onClick={() => refundsQuery.refetch()}>
                            {t("refunds.retry")}
                        </Button>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    data={filteredRefunds}
                    rowKey={(refund) => refund.id}
                    loading={refundsQuery.isLoading}
                    onRowClick={(refund) => setSelectedRefund(refund)}
                    emptyState={<EmptyState icon={Inbox} title={t("refunds.emptyTitle")} />}
                />
            )}

            <RefundDecisionModal
                open={selectedRefund !== null}
                onClose={() => setSelectedRefund(null)}
                refund={selectedRefund}
                studentName={selectedRefund ? getStudentName(selectedRefund.studentId) : ""}
            />
        </div>
    );
};

export default AdminRefunds;
