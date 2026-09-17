import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertCircle, BookOpen, Lock } from "lucide-react";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient, readErrorMessage } from "@/shared/api/client";
import { useLessonPlayerQuery, lessonPlayerQueryKey } from "@/shared/api/queries/useLessonPlayerQuery";
import { useToast } from "@/shared/ui/useToast";
import LessonPlayerLayout from "@/shared/layout/LessonPlayerLayout";
import LessonListSidebar from "./components/LessonListSidebar";
import LessonContentViewer from "./components/LessonContentViewer";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Skeleton, { SkeletonText } from "@/shared/ui/Skeleton";

const LessonPlayer = () => {
    const { t } = useTranslation("student");
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const query = useLessonPlayerQuery(courseId);
    const data = query.data;
    const lessons = data?.lessons ?? [];

    const [selectedLessonId, setSelectedLessonId] = useState<number | undefined>(undefined);
    const [completing, setCompleting] = useState(false);
    // UI_SPEC §3.3 Accessibility — trạng thái hoàn thành lesson công bố qua aria-live, không chỉ
    // dựa vào checkmark trực quan trong sidebar (khác toast "hoàn thành khóa học" chỉ bắn ở lesson
    // cuối cùng).
    const [completionAnnouncement, setCompletionAnnouncement] = useState("");

    useEffect(() => {
        if (!data) return;
        if (selectedLessonId !== undefined && data.lessons.some((l) => l.lessonId === selectedLessonId)) return;
        const firstIncomplete = data.lessons.find((l) => !l.completed) ?? data.lessons[0];
        setSelectedLessonId(firstIncomplete?.lessonId);
    }, [data, selectedLessonId]);

    const selectedLesson = lessons.find((l) => l.lessonId === selectedLessonId);
    const handleExit = () => navigate(ROUTES.STUDENT.MY_COURSES);

    const handleMarkComplete = async () => {
        if (!selectedLesson || !courseId) return;
        setCompleting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.LESSONS.COMPLETE(selectedLesson.lessonId), {
                method: "POST",
            });

            if (!res.ok) {
                showToast({ tone: "danger", message: await readErrorMessage(res, t("lessonPlayer.updateProgressFailed")) });
                return;
            }

            await queryClient.invalidateQueries({ queryKey: lessonPlayerQueryKey(courseId) });
            setCompletionAnnouncement(t("lessonPlayer.lessonCompletedAnnouncement", { title: selectedLesson.title }));

            const currentIndex = lessons.findIndex((l) => l.lessonId === selectedLesson.lessonId);
            const next = lessons[currentIndex + 1];
            if (next) {
                setSelectedLessonId(next.lessonId);
            } else {
                showToast({ tone: "success", message: t("lessonPlayer.courseCompleted") });
            }
        } catch {
            showToast({ tone: "danger", message: t("lessonPlayer.connectionError") });
        } finally {
            setCompleting(false);
        }
    };

    if (query.isLoading) {
        return (
            <div className="min-h-screen bg-surface-muted p-6 space-y-4">
                <Skeleton className="h-14 w-full rounded-radius-md" />
                <div className="flex gap-4">
                    <Skeleton className="h-[60vh] w-sidebar rounded-radius-md hidden lg:block" />
                    <div className="flex-1">
                        <SkeletonText lines={8} />
                    </div>
                </div>
            </div>
        );
    }

    if (query.isError || !data) {
        return (
            <div className="min-h-screen bg-surface-muted flex items-center justify-center p-6">
                <EmptyState
                    icon={AlertCircle}
                    title={t("lessonPlayer.loadErrorTitle")}
                    description={t("lessonPlayer.loadErrorDescription")}
                    action={
                        <Button variant="primary" onClick={handleExit}>
                            {t("lessonPlayer.back")}
                        </Button>
                    }
                />
            </div>
        );
    }

    // BR-007: chưa mua và course không có lesson preview nào → không có gì để xem (khác trường hợp
    // course thật sự chưa có lesson, xử lý riêng ở nhánh dưới).
    if (!data.enrolled && lessons.length === 0) {
        return (
            <div className="min-h-screen bg-surface-muted flex items-center justify-center p-6">
                <EmptyState
                    icon={Lock}
                    title={t("lessonPlayer.needPurchaseTitle")}
                    action={
                        <Button variant="primary" onClick={() => navigate(ROUTES.COURSE_DETAIL(String(data.courseId)))}>
                            {t("lessonPlayer.viewCourseDetail")}
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <LessonPlayerLayout
            courseTitle={data.courseTitle}
            progressPercent={data.progressPercent}
            onExit={handleExit}
            sidebar={
                <LessonListSidebar
                    lessons={lessons}
                    selectedLessonId={selectedLessonId}
                    onSelect={setSelectedLessonId}
                />
            }
        >
            <div aria-live="polite" className="sr-only">
                {completionAnnouncement}
            </div>

            {lessons.length === 0 ? (
                <EmptyState icon={BookOpen} title={t("lessonPlayer.contentUpdating")} />
            ) : selectedLesson ? (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-h2 text-primary">{selectedLesson.title}</h1>
                    </div>
                    <LessonContentViewer key={selectedLesson.lessonId} lesson={selectedLesson} />
                    <div className="flex justify-end sticky bottom-0 py-3 bg-surface-muted lg:static lg:bg-transparent lg:py-0">
                        <Button variant="primary" loading={completing} onClick={handleMarkComplete}>
                            {t("lessonPlayer.markComplete")}
                        </Button>
                    </div>
                </div>
            ) : null}
        </LessonPlayerLayout>
    );
};

export default LessonPlayer;
