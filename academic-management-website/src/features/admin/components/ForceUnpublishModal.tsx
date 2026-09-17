import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { adminCoursesQueryKey } from "@/shared/api/queries/useAdminCoursesQuery";
import { useToast } from "@/shared/ui/useToast";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Textarea from "@/shared/ui/Textarea";

interface ForceUnpublishModalProps {
    open: boolean;
    onClose: () => void;
    course: { courseId: number; title: string } | null;
}

// UI_SPEC §5.3 — Force-unpublish chỉ ẩn khỏi catalog (course chuyển ARCHIVED), KHÔNG thu hồi quyền
// truy cập của học viên đã mua (BR-005) — đó là action "Thu hồi quyền truy cập" riêng biệt.
const ForceUnpublishModal = ({ open, onClose, course }: ForceUnpublishModalProps) => {
    const { t } = useTranslation("admin");
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    const handleClose = () => {
        setReason("");
        setError(undefined);
        onClose();
    };

    const handleConfirm = async () => {
        if (!course) return;
        if (!reason.trim()) {
            setError(t("forceUnpublishModal.reasonRequired"));
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.COURSES.ADMIN_FORCE_UNPUBLISH(course.courseId), {
                method: "POST",
                body: JSON.stringify({ reason }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                showToast({ tone: "danger", message: data?.message || t("forceUnpublishModal.failed") });
                return;
            }

            showToast({ tone: "success", message: t("forceUnpublishModal.success") });
            queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
            handleClose();
        } catch {
            showToast({ tone: "danger", message: t("forceUnpublishModal.connectionError") });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={t("forceUnpublishModal.title")}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                        {t("forceUnpublishModal.cancel")}
                    </Button>
                    <Button variant="danger" onClick={handleConfirm} loading={submitting}>
                        {t("forceUnpublishModal.confirm")}
                    </Button>
                </>
            }
        >
            <p className="text-body text-secondary mb-4">
                {t("forceUnpublishModal.descriptionPrefix")} <span className="font-semibold text-primary">{course?.title}</span> {t("forceUnpublishModal.descriptionSuffix")}
            </p>
            <FormField label={t("forceUnpublishModal.reasonLabel")} required error={error}>
                <Textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        if (error) setError(undefined);
                    }}
                    placeholder={t("forceUnpublishModal.reasonPlaceholder")}
                />
            </FormField>
        </Modal>
    );
};

export default ForceUnpublishModal;
