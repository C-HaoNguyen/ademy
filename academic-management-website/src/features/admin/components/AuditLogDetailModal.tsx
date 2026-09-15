import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import DetailRow from "@/shared/ui/DetailRow";
import type { AdminAuditLog } from "@/shared/api/queries/useAdminAuditLogsQuery";
import { getAuditActionLabel } from "@/features/admin/audit-log/auditActions";

interface AuditLogDetailModalProps {
    open: boolean;
    onClose: () => void;
    log: AdminAuditLog | null;
}

const formatMetadata = (metadata: string | null): string => {
    if (!metadata) return "—";
    try {
        return JSON.stringify(JSON.parse(metadata), null, 2);
    } catch {
        return metadata;
    }
};

// UI_SPEC §5.8 — read-only, click dòng mở Modal chi tiết xem metadata đầy đủ (không có action ghi).
const AuditLogDetailModal = ({ open, onClose, log }: AuditLogDetailModalProps) => {
    if (!log) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Log #${log.id}`}
            size="md"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Đóng
                </Button>
            }
        >
            <div>
                <DetailRow label="Thời gian" value={new Date(log.createdAt).toLocaleString("vi-VN")} />
                <DetailRow label="Người thực hiện" value={log.actorUsername ?? "—"} />
                <DetailRow label="Hành động" value={getAuditActionLabel(log.action)} />
                <DetailRow label="Đối tượng" value={log.targetType ? `${log.targetType} #${log.targetId ?? "—"}` : "—"} />
                <DetailRow
                    label="Kết quả"
                    value={
                        <Badge variant="status" tone={log.success ? "success" : "danger"}>
                            {log.success ? "Thành công" : "Thất bại"}
                        </Badge>
                    }
                />
            </div>
            <div className="mt-4">
                <p className="mb-1 text-body-sm font-medium text-secondary">Metadata</p>
                <pre className="max-h-64 overflow-auto rounded-radius-md bg-surface-muted p-3 text-caption text-primary whitespace-pre-wrap break-words">
                    {formatMetadata(log.metadata)}
                </pre>
            </div>
        </Modal>
    );
};

export default AuditLogDetailModal;
