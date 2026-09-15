import { useMemo, useState } from "react";
import { ClipboardList, SearchX, AlertTriangle } from "lucide-react";
import { useAdminAuditLogsQuery, type AdminAuditLog as AuditLogEntry } from "@/shared/api/queries/useAdminAuditLogsQuery";
import { useAdminUsersQuery } from "@/shared/api/queries/useAdminUsersQuery";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import FormField from "@/shared/ui/FormField";
import Table, { type TableColumn } from "@/shared/ui/Table";
import DateRangeInput from "@/shared/ui/DateRangeInput";
import AuditLogDetailModal from "@/features/admin/components/AuditLogDetailModal";
import { AUDIT_ACTIONS, getAuditActionLabel } from "@/features/admin/audit-log/auditActions";

type DateRange = { from: Date | null; to: Date | null };

// LocalDateTime backend nhận "yyyy-MM-ddTHH:mm:ss" — from = đầu ngày, to = cuối ngày để filter theo
// khoảng ngày trọn vẹn (người dùng chọn ngày, không chọn giờ).
const toStartOfDayIso = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00`;
};

const toEndOfDayIso = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T23:59:59`;
};

const selectClassName =
    "h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand";

const AdminAuditLog = () => {
    const [actorUsername, setActorUsername] = useState("");
    const [action, setAction] = useState("");
    const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

    const usersQuery = useAdminUsersQuery();
    const actors = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

    const filters = useMemo(
        () => ({
            actorUsername: actorUsername || undefined,
            action: action || undefined,
            from: dateRange.from ? toStartOfDayIso(dateRange.from) : undefined,
            to: dateRange.to ? toEndOfDayIso(dateRange.to) : undefined,
        }),
        [actorUsername, action, dateRange]
    );

    const logsQuery = useAdminAuditLogsQuery(filters);
    const logs = logsQuery.data ?? [];

    const columns: TableColumn<AuditLogEntry>[] = [
        {
            key: "createdAt",
            header: "Thời gian",
            render: (log) => new Date(log.createdAt).toLocaleString("vi-VN"),
        },
        {
            key: "actor",
            header: "Người thực hiện",
            render: (log) => log.actorUsername ?? "—",
        },
        {
            key: "action",
            header: "Hành động",
            render: (log) => getAuditActionLabel(log.action),
        },
        {
            key: "target",
            header: "Đối tượng",
            render: (log) => (log.targetType ? `${log.targetType} #${log.targetId ?? "—"}` : "—"),
        },
        {
            key: "detail",
            header: "Chi tiết",
            render: (log) => (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                    }}
                    className="text-action-tertiary-text hover:underline"
                >
                    Xem chi tiết
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="flex items-center gap-3 text-h2 text-primary">
                    <ClipboardList size={24} aria-hidden="true" />
                    Audit Log
                </h2>
                <p className="text-body-sm text-secondary mt-1">
                    Tra cứu lịch sử hành động nhạy cảm trên nền tảng.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label="Người thực hiện">
                    <select value={actorUsername} onChange={(e) => setActorUsername(e.target.value)} className={selectClassName}>
                        <option value="">Tất cả</option>
                        {actors.map((u) => (
                            <option key={u.userId} value={u.username}>
                                {u.fullName} (@{u.username})
                            </option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Hành động">
                    <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClassName}>
                        <option value="">Tất cả</option>
                        {AUDIT_ACTIONS.map((a) => (
                            <option key={a.value} value={a.value}>
                                {a.label}
                            </option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Khoảng thời gian">
                    <DateRangeInput value={dateRange} onChange={setDateRange} />
                </FormField>
            </div>

            {logsQuery.isError ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="Không thể tải audit log"
                    description="Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
                    action={
                        <Button variant="primary" size="sm" onClick={() => logsQuery.refetch()}>
                            Thử lại
                        </Button>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    data={logs}
                    rowKey={(log) => log.id}
                    loading={logsQuery.isLoading}
                    onRowClick={(log) => setSelectedLog(log)}
                    emptyState={<EmptyState icon={SearchX} title="Không có log nào phù hợp bộ lọc" />}
                />
            )}

            <AuditLogDetailModal open={selectedLog !== null} onClose={() => setSelectedLog(null)} log={selectedLog} />
        </div>
    );
};

export default AdminAuditLog;
