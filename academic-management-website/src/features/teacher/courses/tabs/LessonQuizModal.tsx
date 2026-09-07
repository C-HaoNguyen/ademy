import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useTeacherLessonQuizQuery, teacherLessonQuizQueryKey } from "@/shared/api/queries/useTeacherQuizQuery";
import { useToast } from "@/shared/ui/useToast";
import Modal from "@/shared/ui/Modal";
import { SkeletonText } from "@/shared/ui/Skeleton";
import QuizEditorForm, { type QuizSavePayload } from "./QuizEditorForm";

interface LessonQuizModalProps {
    open: boolean;
    onClose: () => void;
    courseId: number;
    lessonId: number;
    lessonTitle: string;
}

const LessonQuizModal = ({ open, onClose, courseId, lessonId, lessonTitle }: LessonQuizModalProps) => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const quizQuery = useTeacherLessonQuizQuery(open ? courseId : undefined, open ? lessonId : undefined);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: teacherLessonQuizQueryKey(courseId, lessonId) });

    const handleSubmit = async (payload: QuizSavePayload) => {
        setSaving(true);
        try {
            const res = await apiClient(API_ENDPOINTS.TEACHER.LESSON_QUIZ(courseId, lessonId), {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                showToast({ tone: "danger", message: data?.message || "Lưu quiz thất bại" });
                return;
            }
            showToast({ tone: "success", message: "Đã lưu quiz" });
            invalidate();
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.TEACHER.LESSON_QUIZ(courseId, lessonId), { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                showToast({ tone: "danger", message: data?.message || "Xóa quiz thất bại" });
                return;
            }
            showToast({ tone: "success", message: "Đã xóa quiz" });
            invalidate();
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={`Quiz cho lesson "${lessonTitle}"`} size="lg">
            {quizQuery.isLoading ? (
                <SkeletonText lines={4} />
            ) : (
                <QuizEditorForm
                    initialQuiz={quizQuery.data ?? null}
                    saving={saving}
                    onSubmit={handleSubmit}
                    onDelete={quizQuery.data ? handleDelete : undefined}
                    deleting={deleting}
                />
            )}
        </Modal>
    );
};

export default LessonQuizModal;
