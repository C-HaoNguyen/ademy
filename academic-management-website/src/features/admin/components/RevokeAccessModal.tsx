import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Users } from "lucide-react";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import {
    useAdminCourseStudentsQuery,
    adminCourseStudentsQueryKey,
    type AdminEnrolledStudent,
} from "@/shared/api/queries/useAdminCourseStudentsQuery";
import { adminCoursesQueryKey } from "@/shared/api/queries/useAdminCoursesQuery";
import { useToast } from "@/shared/ui/useToast";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Textarea from "@/shared/ui/Textarea";
import Badge from "@/shared/ui/Badge";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";

interface RevokeAccessModalProps {
    open: boolean;
    onClose: () => void;
    course: { courseId: number; title: string } | null;
}

// UI_SPEC §5.3 — "Thu hồi quyền truy cập" là action tách biệt khỏi force-unpublish, thực hiện theo
// từng học viên: bước 1 chọn học viên trong danh sách của course, bước 2 nhập lý do bắt buộc rồi
// xác nhận riêng cho đúng học viên đó (PRD-027 "hành động tường minh riêng").
const RevokeAccessModal = ({ open, onClose, course }: RevokeAccessModalProps) => {
    const { t } = useTranslation("admin");
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [selectedStudent, setSelectedStudent] = useState<AdminEnrolledStudent | null>(null);
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    const studentsQuery = useAdminCourseStudentsQuery(open ? course?.courseId : undefined);
    const students = studentsQuery.data ?? [];

    const handleClose = () => {
        setSelectedStudent(null);
        setReason("");
        setError(undefined);
        onClose();
    };

    const handleBack = () => {
        setSelectedStudent(null);
        setReason("");
        setError(undefined);
    };

    const handleConfirm = async () => {
        if (!selectedStudent || !course) return;
        if (!reason.trim()) {
            setError(t("revokeAccessModal.reasonRequired"));
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.ENROLLMENTS.ADMIN_REVOKE_ACCESS(selectedStudent.enrollmentId), {
                method: "POST",
                body: JSON.stringify({ reason }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                showToast({ tone: "danger", message: data?.message || t("revokeAccessModal.failed") });
                return;
            }

            showToast({ tone: "success", message: t("revokeAccessModal.success", { fullName: selectedStudent.studentFullName }) });
            queryClient.invalidateQueries({ queryKey: adminCourseStudentsQueryKey(course.courseId) });
            queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
            handleBack();
        } catch {
            showToast({ tone: "danger", message: t("revokeAccessModal.connectionError") });
        } finally {
            setSubmitting(false);
        }
    };

    const reasonStep = selectedStudent !== null;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={reasonStep ? t("revokeAccessModal.titleWithStudent", { fullName: selectedStudent.studentFullName }) : t("revokeAccessModal.title")}
            size="md"
            footer={
                reasonStep ? (
                    <>
                        <Button variant="secondary" iconLeft={ChevronLeft} onClick={handleBack} disabled={submitting}>
                            {t("revokeAccessModal.back")}
                        </Button>
                        <Button variant="danger" onClick={handleConfirm} loading={submitting}>
                            {t("revokeAccessModal.confirm")}
                        </Button>
                    </>
                ) : (
                    <Button variant="secondary" onClick={handleClose}>
                        {t("revokeAccessModal.close")}
                    </Button>
                )
            }
        >
            {reasonStep ? (
                <FormField label={t("revokeAccessModal.reasonLabel")} required error={error}>
                    <Textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError(undefined);
                        }}
                        placeholder={t("revokeAccessModal.reasonPlaceholder")}
                    />
                </FormField>
            ) : studentsQuery.isLoading ? (
                <SkeletonText lines={4} />
            ) : students.length === 0 ? (
                <EmptyState icon={Users} title={t("revokeAccessModal.emptyTitle")} />
            ) : (
                <ul className="divide-y divide-default">
                    {students.map((s) => (
                        <li key={s.enrollmentId} className="flex items-center justify-between py-3">
                            <div>
                                <p className="font-medium text-primary">{s.studentFullName}</p>
                                <p className="text-caption text-secondary">@{s.studentUsername}</p>
                            </div>
                            {s.accessRevokedAt ? (
                                <Badge variant="status" tone="danger">
                                    {t("revokeAccessModal.revoked")}
                                </Badge>
                            ) : (
                                <Button variant="danger" size="sm" onClick={() => setSelectedStudent(s)}>
                                    {t("revokeAccessModal.revoke")}
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    );
};

export default RevokeAccessModal;
