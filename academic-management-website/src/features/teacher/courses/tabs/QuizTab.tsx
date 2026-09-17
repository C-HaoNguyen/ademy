import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useTeacherCourseQuizQuery, teacherCourseQuizQueryKey } from "@/shared/api/queries/useTeacherQuizQuery";
import { useToast } from "@/shared/ui/useToast";
import Card from "@/shared/ui/Card";
import { SkeletonText } from "@/shared/ui/Skeleton";
import QuizEditorForm, { type QuizSavePayload } from "./QuizEditorForm";

interface QuizTabProps {
    courseId: number;
}

const QuizTab = ({ courseId }: QuizTabProps) => {
    const { t } = useTranslation("teacher");
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const quizQuery = useTeacherCourseQuizQuery(courseId);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: teacherCourseQuizQueryKey(courseId) });

    const handleSubmit = async (payload: QuizSavePayload) => {
        setSaving(true);
        try {
            const res = await apiClient(API_ENDPOINTS.TEACHER.COURSE_QUIZ(courseId), {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                showToast({ tone: "danger", message: data?.message || t("quizTab.saveFailed") });
                return;
            }
            showToast({ tone: "success", message: t("quizTab.saved") });
            invalidate();
        } catch {
            showToast({ tone: "danger", message: t("quizTab.connectionError") });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.TEACHER.COURSE_QUIZ(courseId), { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                showToast({ tone: "danger", message: data?.message || t("quizTab.deleteFailed") });
                return;
            }
            showToast({ tone: "success", message: t("quizTab.deleted") });
            invalidate();
        } catch {
            showToast({ tone: "danger", message: t("quizTab.connectionError") });
        } finally {
            setDeleting(false);
        }
    };

    if (quizQuery.isLoading) {
        return (
            <Card variant="app">
                <SkeletonText lines={4} />
            </Card>
        );
    }

    return (
        <QuizEditorForm
            initialQuiz={quizQuery.data ?? null}
            saving={saving}
            onSubmit={handleSubmit}
            onDelete={quizQuery.data ? handleDelete : undefined}
            deleting={deleting}
        />
    );
};

export default QuizTab;
