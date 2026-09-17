import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("admin");
    if (!log) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={t("auditLogDetailModal.title", { id: log.id })}
            size="md"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    {t("auditLogDetailModal.close")}
                </Button>
            }
        >
            <div>
                <DetailRow label={t("auditLogDetailModal.time")} value={new Date(log.createdAt).toLocaleString("vi-VN")} />
                <DetailRow label={t("auditLogDetailModal.actor")} value={log.actorUsername ?? "—"} />
                <DetailRow label={t("auditLogDetailModal.action")} value={getAuditActionLabel(log.action, t)} />
                <DetailRow label={t("auditLogDetailModal.target")} value={log.targetType ? `${log.targetType} #${log.targetId ?? "—"}` : "—"} />
                <DetailRow
                    label={t("auditLogDetailModal.result")}
                    value={
                        <Badge variant="status" tone={log.success ? "success" : "danger"}>
                            {log.success ? t("auditLogDetailModal.resultSuccess") : t("auditLogDetailModal.resultFailed")}
                        </Badge>
                    }
                />
            </div>
            <div className="mt-4">
                <p className="mb-1 text-body-sm font-medium text-secondary">{t("auditLogDetailModal.metadata")}</p>
                <pre className="max-h-64 overflow-auto rounded-radius-md bg-surface-muted p-3 text-caption text-primary whitespace-pre-wrap break-words">
                    {formatMetadata(log.metadata)}
                </pre>
            </div>
        </Modal>
    );
};

export default AuditLogDetailModal;
