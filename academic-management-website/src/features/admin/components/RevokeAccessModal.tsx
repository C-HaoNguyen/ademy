import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
            setError("Vui lòng nhập lý do thu hồi");
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
                showToast({ tone: "danger", message: data?.message || "Thu hồi quyền truy cập thất bại" });
                return;
            }

            showToast({ tone: "success", message: `Đã thu hồi quyền truy cập của ${selectedStudent.studentFullName}` });
            queryClient.invalidateQueries({ queryKey: adminCourseStudentsQueryKey(course.courseId) });
            queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
            handleBack();
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setSubmitting(false);
        }
    };

    const reasonStep = selectedStudent !== null;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={reasonStep ? `Thu hồi quyền truy cập — ${selectedStudent.studentFullName}` : "Thu hồi quyền truy cập"}
            size="md"
            footer={
                reasonStep ? (
                    <>
                        <Button variant="secondary" iconLeft={ChevronLeft} onClick={handleBack} disabled={submitting}>
                            Quay lại
                        </Button>
                        <Button variant="danger" onClick={handleConfirm} loading={submitting}>
                            Xác nhận thu hồi
                        </Button>
                    </>
                ) : (
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                )
            }
        >
            {reasonStep ? (
                <FormField label="Lý do thu hồi" required error={error}>
                    <Textarea
                        rows={3}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError(undefined);
                        }}
                        placeholder="Mô tả lý do thu hồi quyền truy cập"
                    />
                </FormField>
            ) : studentsQuery.isLoading ? (
                <SkeletonText lines={4} />
            ) : students.length === 0 ? (
                <EmptyState icon={Users} title="Chưa có học viên đăng ký" />
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
                                    Đã thu hồi
                                </Badge>
                            ) : (
                                <Button variant="danger" size="sm" onClick={() => setSelectedStudent(s)}>
                                    Thu hồi
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
