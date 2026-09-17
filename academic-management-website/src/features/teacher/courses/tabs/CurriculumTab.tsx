import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, Video, FileText, HelpCircle, ListVideo, ListChecks } from "lucide-react";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import {
    useTeacherLessonsQuery,
    teacherLessonsQueryKey,
    type TeacherLesson,
} from "@/shared/api/queries/useTeacherLessonsQuery";
import { useToast } from "@/shared/ui/useToast";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import EmptyState from "@/shared/ui/EmptyState";
import ConfirmDeleteModal from "@/shared/ui/ConfirmDeleteModal";
import { SkeletonText } from "@/shared/ui/Skeleton";
import LessonFormModal from "./LessonFormModal";
import LessonQuizModal from "./LessonQuizModal";

const contentTypeIcon = { video: Video, document: FileText, quiz: HelpCircle } as const;

interface CurriculumTabProps {
    courseId: number;
}

const CurriculumTab = ({ courseId }: CurriculumTabProps) => {
    const { t } = useTranslation("teacher");
    const contentTypeLabel = {
        video: t("curriculumTab.contentTypeVideo"),
        document: t("curriculumTab.contentTypeDocument"),
        quiz: t("curriculumTab.contentTypeQuiz"),
    } as const;
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const lessonsQuery = useTeacherLessonsQuery(courseId);
    const lessons = lessonsQuery.data ?? [];

    const [formOpen, setFormOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<TeacherLesson | undefined>(undefined);
    const [deletingLesson, setDeletingLesson] = useState<TeacherLesson | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [reordering, setReordering] = useState(false);
    const [quizLesson, setQuizLesson] = useState<TeacherLesson | null>(null);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: teacherLessonsQueryKey(courseId) });

    const handleAdd = () => {
        setEditingLesson(undefined);
        setFormOpen(true);
    };

    const handleEdit = (lesson: TeacherLesson) => {
        setEditingLesson(lesson);
        setFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingLesson) return;
        setDeleting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.TEACHER.LESSON_DETAIL(courseId, deletingLesson.lessonId), {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                showToast({ tone: "danger", message: data?.message || t("curriculumTab.deleteLessonFailed") });
                return;
            }
            showToast({ tone: "success", message: t("curriculumTab.lessonDeleted") });
            setDeletingLesson(null);
            invalidate();
        } catch {
            showToast({ tone: "danger", message: t("curriculumTab.connectionError") });
        } finally {
            setDeleting(false);
        }
    };

    // Không có bulk-reorder endpoint — đổi thứ tự bằng cách hoán đổi orderIndex của 2 lesson liền kề,
    // gửi tuần tự 2 request PUT.
    const swapOrder = async (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= lessons.length) return;

        const current = lessons[index];
        const target = lessons[targetIndex];

        setReordering(true);
        try {
            const buildPayload = (lesson: TeacherLesson, orderIndex: number) => ({
                title: lesson.title,
                content: lesson.contentType === "document" ? lesson.content ?? "" : undefined,
                orderIndex,
                duration: lesson.duration ?? undefined,
                isPreview: lesson.preview,
                contentType: lesson.contentType,
                videoUrl: lesson.contentType === "video" ? lesson.videoUrl ?? undefined : undefined,
            });

            const [resA, resB] = await Promise.all([
                apiClient(API_ENDPOINTS.TEACHER.LESSON_DETAIL(courseId, current.lessonId), {
                    method: "PUT",
                    body: JSON.stringify(buildPayload(current, target.orderIndex)),
                }),
                apiClient(API_ENDPOINTS.TEACHER.LESSON_DETAIL(courseId, target.lessonId), {
                    method: "PUT",
                    body: JSON.stringify(buildPayload(target, current.orderIndex)),
                }),
            ]);

            if (!resA.ok || !resB.ok) {
                showToast({ tone: "danger", message: t("curriculumTab.reorderFailed") });
                return;
            }

            invalidate();
        } catch {
            showToast({ tone: "danger", message: t("curriculumTab.connectionError") });
        } finally {
            setReordering(false);
        }
    };

    if (lessonsQuery.isLoading) {
        return (
            <Card variant="app">
                <SkeletonText lines={4} />
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="primary" iconLeft={Plus} onClick={handleAdd}>
                    {t("curriculumTab.addLesson")}
                </Button>
            </div>

            {lessons.length === 0 ? (
                <EmptyState
                    icon={ListVideo}
                    title={t("curriculumTab.emptyTitle")}
                    description={t("curriculumTab.emptyDescription")}
                    action={
                        <Button variant="primary" iconLeft={Plus} onClick={handleAdd}>
                            {t("curriculumTab.addLesson")}
                        </Button>
                    }
                />
            ) : (
                <ul className="space-y-2">
                    {lessons.map((lesson, index) => {
                        const Icon = contentTypeIcon[lesson.contentType];
                        return (
                            <li key={lesson.lessonId}>
                                <Card variant="app" padding="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <button
                                                type="button"
                                                disabled={index === 0 || reordering}
                                                onClick={() => swapOrder(index, -1)}
                                                className="text-tertiary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label={t("curriculumTab.moveUp")}
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={index === lessons.length - 1 || reordering}
                                                onClick={() => swapOrder(index, 1)}
                                                className="text-tertiary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                aria-label={t("curriculumTab.moveDown")}
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                        </div>

                                        <div className="p-2 rounded-radius-md bg-surface-brand-muted text-brand shrink-0">
                                            <Icon size={18} aria-hidden="true" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-body font-medium text-primary truncate">
                                                {lesson.title}
                                            </p>
                                            <p className="text-caption text-secondary">
                                                {contentTypeLabel[lesson.contentType]}
                                                {lesson.duration ? ` · ${t("curriculumTab.durationMinutes", { duration: lesson.duration })}` : ""}
                                            </p>
                                        </div>

                                        {lesson.preview && (
                                            <Badge variant="status" tone="info">
                                                {t("curriculumTab.preview")}
                                            </Badge>
                                        )}

                                        <div className="flex items-center gap-1 shrink-0">
                                            {lesson.contentType === "quiz" && (
                                                <button
                                                    type="button"
                                                    onClick={() => setQuizLesson(lesson)}
                                                    className="cursor-pointer p-2 rounded-radius-md text-brand hover:bg-surface-brand-muted transition-colors"
                                                    aria-label={t("curriculumTab.manageQuizAria", { title: lesson.title })}
                                                    title={t("curriculumTab.manageQuiz")}
                                                >
                                                    <ListChecks size={16} aria-hidden="true" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(lesson)}
                                                className="cursor-pointer p-2 rounded-radius-md text-brand hover:bg-surface-brand-muted transition-colors"
                                                aria-label={t("curriculumTab.editLessonAria", { title: lesson.title })}
                                            >
                                                <Pencil size={16} aria-hidden="true" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeletingLesson(lesson)}
                                                className="cursor-pointer p-2 rounded-radius-md text-status-danger-text hover:bg-status-danger-bg transition-colors"
                                                aria-label={t("curriculumTab.deleteLessonAria", { title: lesson.title })}
                                            >
                                                <Trash2 size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            </li>
                        );
                    })}
                </ul>
            )}

            <LessonFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                courseId={courseId}
                lesson={editingLesson}
                nextOrderIndex={lessons.length}
                onSaved={invalidate}
            />

            <ConfirmDeleteModal
                open={deletingLesson !== null}
                onClose={() => setDeletingLesson(null)}
                onConfirm={handleDelete}
                itemName={deletingLesson?.title ?? ""}
                loading={deleting}
            />

            {quizLesson && (
                <LessonQuizModal
                    open={quizLesson !== null}
                    onClose={() => setQuizLesson(null)}
                    courseId={courseId}
                    lessonId={quizLesson.lessonId}
                    lessonTitle={quizLesson.title}
                />
            )}
        </div>
    );
};

export default CurriculumTab;
