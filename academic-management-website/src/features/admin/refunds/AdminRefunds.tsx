import { useMemo, useState } from "react";
import { RotateCcw, Inbox, AlertTriangle } from "lucide-react";
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

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "REQUESTED", label: "Đang chờ" },
    { key: "APPROVED", label: "Đã duyệt" },
    { key: "REJECTED", label: "Đã từ chối" },
];

const AdminRefunds = () => {
    const refundsQuery = useAdminRefundsQuery();
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
            header: "Học viên",
            render: (refund) => getStudentName(refund.studentId),
        },
        {
            key: "course",
            header: "Khóa học",
            render: (refund) => refund.courseTitle,
        },
        {
            key: "amount",
            header: "Số tiền",
            render: (refund) => <span className="font-medium text-primary">{formatCurrency(refund.amount)}</span>,
        },
        {
            key: "reason",
            header: "Lý do",
            render: (refund) => <span className="line-clamp-1 max-w-xs">{refund.reason}</span>,
        },
        {
            key: "requestedAt",
            header: "Ngày yêu cầu",
            render: (refund) => new Date(refund.requestedAt).toLocaleDateString("vi-VN"),
        },
        {
            key: "businessStatus",
            header: "Trạng thái nghiệp vụ",
            render: (refund) => (
                <Badge variant="status" tone={getBusinessStatusTone(refund.businessStatus)}>
                    {getBusinessStatusLabel(refund.businessStatus)}
                </Badge>
            ),
        },
        {
            key: "executionStatus",
            header: "Trạng thái xử lý",
            render: (refund) => (
                <Badge variant="status" tone={getExecutionStatusTone(refund.executionStatus)}>
                    {getExecutionStatusLabel(refund.executionStatus)}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="flex items-center gap-3 text-h2 text-primary">
                    <RotateCcw size={24} aria-hidden="true" />
                    Quản lý hoàn tiền
                </h2>
                <p className="text-body-sm text-secondary mt-1">
                    Xem xét, duyệt/từ chối yêu cầu hoàn tiền — sau khi duyệt, đánh dấu đã hoàn tiền thủ công.
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
                    title="Không thể tải danh sách yêu cầu hoàn tiền"
                    description="Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
                    action={
                        <Button variant="primary" size="sm" onClick={() => refundsQuery.refetch()}>
                            Thử lại
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
                    emptyState={<EmptyState icon={Inbox} title="Không có yêu cầu nào đang chờ duyệt" />}
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
