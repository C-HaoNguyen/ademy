import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("teacher");
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
                showToast({ tone: "danger", message: data?.message || t("lessonQuizModal.saveFailed") });
                return;
            }
            showToast({ tone: "success", message: t("lessonQuizModal.saved") });
            invalidate();
        } catch {
            showToast({ tone: "danger", message: t("lessonQuizModal.connectionError") });
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
                showToast({ tone: "danger", message: data?.message || t("lessonQuizModal.deleteFailed") });
                return;
            }
            showToast({ tone: "success", message: t("lessonQuizModal.deleted") });
            invalidate();
        } catch {
            showToast({ tone: "danger", message: t("lessonQuizModal.connectionError") });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title={t("lessonQuizModal.title", { lessonTitle })} size="lg">
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
