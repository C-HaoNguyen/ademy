import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import type { TeacherLesson, TeacherLessonContentType } from "@/shared/api/queries/useTeacherLessonsQuery";
import { useToast } from "@/shared/ui/useToast";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";

type LessonForm = {
    title: string;
    content: string;
    duration: string;
    isPreview: boolean;
    contentType: TeacherLessonContentType;
    videoUrl: string;
};

const emptyForm: LessonForm = {
    title: "",
    content: "",
    duration: "",
    isPreview: false,
    contentType: "document",
    videoUrl: "",
};

const fromLesson = (lesson: TeacherLesson): LessonForm => ({
    title: lesson.title,
    content: lesson.content ?? "",
    duration: lesson.duration != null ? String(lesson.duration) : "",
    isPreview: lesson.preview,
    contentType: lesson.contentType,
    videoUrl: lesson.videoUrl ?? "",
});

interface LessonFormModalProps {
    open: boolean;
    onClose: () => void;
    courseId: number;
    lesson?: TeacherLesson;
    nextOrderIndex: number;
    onSaved: () => void;
}

const LessonFormModal = ({ open, onClose, courseId, lesson, nextOrderIndex, onSaved }: LessonFormModalProps) => {
    const { t } = useTranslation("teacher");
    const { showToast } = useToast();
    const [form, setForm] = useState<LessonForm>(lesson ? fromLesson(lesson) : emptyForm);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(lesson ? fromLesson(lesson) : emptyForm);
            setError(null);
        }
    }, [open, lesson]);

    const handleUploadVideo = async (file: File) => {
        if (!lesson) return;

        setUploading(true);
        try {
            const presignRes = await apiClient(
                API_ENDPOINTS.TEACHER.LESSON_VIDEO_PRESIGN(courseId, lesson.lessonId),
                {
                    method: "POST",
                    body: JSON.stringify({ contentType: file.type }),
                }
            );

            const presignData = await presignRes.json().catch(() => null);
            if (!presignRes.ok) {
                showToast({ tone: "danger", message: presignData?.message || t("lessonFormModal.presignFailed") });
                return;
            }

            const uploadRes = await fetch(presignData.uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!uploadRes.ok) {
                showToast({ tone: "danger", message: t("lessonFormModal.uploadFailed") });
                return;
            }

            setForm((prev) => ({ ...prev, videoUrl: presignData.publicUrl }));
            showToast({ tone: "success", message: t("lessonFormModal.videoUploaded") });
        } catch {
            showToast({ tone: "danger", message: t("lessonFormModal.uploadConnectionError") });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) {
            setError(t("lessonFormModal.titleRequired"));
            return;
        }
        if (form.contentType === "video" && !form.videoUrl.trim()) {
            setError(t("lessonFormModal.videoUrlRequired"));
            return;
        }
        setError(null);

        setSaving(true);
        try {
            const payload = {
                title: form.title,
                content: form.contentType === "document" ? form.content : undefined,
                orderIndex: lesson?.orderIndex ?? nextOrderIndex,
                duration: form.duration ? Number(form.duration) : undefined,
                isPreview: form.isPreview,
                contentType: form.contentType,
                videoUrl: form.contentType === "video" ? form.videoUrl : undefined,
            };

            const res = lesson
                ? await apiClient(API_ENDPOINTS.TEACHER.LESSON_DETAIL(courseId, lesson.lessonId), {
                      method: "PUT",
                      body: JSON.stringify(payload),
                  })
                : await apiClient(API_ENDPOINTS.TEACHER.LESSONS(courseId), {
                      method: "POST",
                      body: JSON.stringify(payload),
                  });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                showToast({ tone: "danger", message: data?.message || t("lessonFormModal.saveFailed") });
                return;
            }

            showToast({ tone: "success", message: t("lessonFormModal.saved") });
            onSaved();
            onClose();
        } catch {
            showToast({ tone: "danger", message: t("lessonFormModal.connectionError") });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={lesson ? t("lessonFormModal.editTitle") : t("lessonFormModal.addTitle")}
            size="lg"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={saving}>
                        {t("lessonFormModal.cancel")}
                    </Button>
                    <Button variant="primary" loading={saving} onClick={handleSubmit}>
                        {t("lessonFormModal.save")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <FormField label={t("lessonFormModal.lessonTitleLabel")} required error={error && !form.title.trim() ? error : undefined}>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </FormField>

                <FormField label={t("lessonFormModal.contentTypeLabel")} required>
                    <select
                        value={form.contentType}
                        onChange={(e) =>
                            setForm({ ...form, contentType: e.target.value as TeacherLessonContentType })
                        }
                        className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                    >
                        <option value="document">{t("lessonFormModal.contentTypeDocument")}</option>
                        <option value="video">{t("lessonFormModal.contentTypeVideo")}</option>
                        <option value="quiz">{t("lessonFormModal.contentTypeQuiz")}</option>
                    </select>
                </FormField>

                {form.contentType === "document" && (
                    <FormField label={t("lessonFormModal.contentLabel")}>
                        <Textarea
                            rows={4}
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                        />
                    </FormField>
                )}

                {form.contentType === "video" && (
                    <FormField
                        label={t("lessonFormModal.videoUrlLabel")}
                        required
                        helperText={t("lessonFormModal.videoUrlHelper")}
                        error={error && form.contentType === "video" && !form.videoUrl.trim() ? error : undefined}
                    >
                        <div className="flex gap-2">
                            <Input
                                value={form.videoUrl}
                                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                                placeholder="https://..."
                                className="flex-1"
                            />
                            {lesson && (
                                <label className="shrink-0">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) void handleUploadVideo(file);
                                        }}
                                    />
                                    <span className="inline-flex items-center gap-1.5 h-10 px-3 rounded-radius-md border border-action-secondary-border text-action-secondary-text hover:bg-action-secondary-bg-hover text-sm cursor-pointer">
                                        {uploading ? t("lessonFormModal.uploading") : <UploadCloud size={16} aria-hidden="true" />}
                                        {t("lessonFormModal.uploadFile")}
                                    </span>
                                </label>
                            )}
                        </div>
                    </FormField>
                )}

                {form.contentType === "quiz" && (
                    <p className="text-body-sm text-secondary">
                        {t("lessonFormModal.quizHint")}
                    </p>
                )}

                <FormField label={t("lessonFormModal.durationLabel")}>
                    <Input
                        type="number"
                        value={form.duration}
                        onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    />
                </FormField>

                <label className="flex items-center gap-2 text-body-sm text-primary cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.isPreview}
                        onChange={(e) => setForm({ ...form, isPreview: e.target.checked })}
                    />
                    {t("lessonFormModal.previewCheckbox")}
                </label>
            </div>
        </Modal>
    );
};

export default LessonFormModal;
