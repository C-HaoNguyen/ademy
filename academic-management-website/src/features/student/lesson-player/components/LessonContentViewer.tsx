import { useState } from "react";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient, readErrorMessage } from "@/shared/api/client";
import { useLessonQuizQuery } from "@/shared/api/queries/useLessonQuizQuery";
import type { StudentLesson } from "@/shared/api/queries/useLessonPlayerQuery";
import { useToast } from "@/shared/ui/useToast";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";
import RadioCardGroup from "@/shared/ui/RadioCardGroup";
import { AlertCircle } from "lucide-react";

interface LessonContentViewerProps {
    lesson: StudentLesson;
}

// Quiz nhúng trong Lesson Player (UI_SPEC §3.3 mục 3 → §3.5) — khác QuizAttempt.tsx (Phase 34, dùng
// cho Test Practice course-level): không điều hướng full-page, không có màn hình kết quả riêng
// biệt, chỉ hiện điểm số ngay trong content area rồi để Student tự bấm "Đánh dấu hoàn thành & tiếp
// tục" ở footer layout để qua lesson kế tiếp.
const LessonQuizViewer = ({ lessonId }: { lessonId: number }) => {
    const { showToast } = useToast();
    const quizQuery = useLessonQuizQuery(lessonId);

    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; correctCount: number; totalQuestions: number } | null>(null);

    const quiz = quizQuery.data;
    const questions = quiz?.questions ?? [];
    const currentQuestion = questions[questionIndex];
    const total = questions.length;

    const handleSubmit = async () => {
        if (!quiz) return;
        if (Object.keys(answers).length === 0) {
            showToast({ tone: "danger", message: "Vui lòng chọn ít nhất 1 đáp án trước khi nộp bài" });
            return;
        }
        setSubmitting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.QUIZ_ATTEMPTS.SUBMIT, {
                method: "POST",
                body: JSON.stringify({
                    quizId: quiz.id,
                    answers: Object.entries(answers).map(([questionId, choiceId]) => ({
                        questionId: Number(questionId),
                        choiceId,
                    })),
                }),
            });

            if (!res.ok) {
                showToast({ tone: "danger", message: await readErrorMessage(res, "Nộp bài thất bại") });
                return;
            }

            setResult(await res.json());
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setSubmitting(false);
        }
    };

    if (quizQuery.isLoading) {
        return (
            <Card variant="app">
                <SkeletonText lines={6} />
            </Card>
        );
    }

    if (quizQuery.isError || !quiz) {
        return (
            <EmptyState
                icon={AlertCircle}
                title="Không thể tải bài kiểm tra"
                description="Lesson này chưa có bài kiểm tra."
            />
        );
    }

    if (result) {
        return (
            <Card variant="app" className="max-w-xl mx-auto text-center space-y-3">
                <h2 className="text-h3 text-primary" aria-live="polite">
                    Kết quả: {result.score.toFixed(1)} điểm
                </h2>
                <p className="text-body text-secondary">
                    Đúng {result.correctCount}/{result.totalQuestions} câu
                </p>
            </Card>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <h2 className="text-h3 text-primary">{quiz.title}</h2>
                <p className="text-body-sm text-secondary mt-1" aria-live="polite">
                    Câu {questionIndex + 1}/{total}
                </p>
            </div>

            {currentQuestion && (
                <Card variant="app">
                    <fieldset>
                        <legend className="text-body font-medium text-primary mb-4">
                            {currentQuestion.questionText}
                        </legend>
                        <RadioCardGroup
                            name={currentQuestion.questionText}
                            options={currentQuestion.choices.map((choice) => ({
                                value: String(choice.id),
                                label: choice.choiceText,
                            }))}
                            value={
                                answers[currentQuestion.id] !== undefined
                                    ? String(answers[currentQuestion.id])
                                    : ""
                            }
                            onChange={(value) =>
                                setAnswers((prev) => ({ ...prev, [currentQuestion.id]: Number(value) }))
                            }
                        />
                    </fieldset>
                </Card>
            )}

            <div className="flex items-center justify-between gap-3">
                <Button
                    variant="secondary"
                    disabled={questionIndex === 0}
                    onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                >
                    Câu trước
                </Button>
                <Button
                    variant="secondary"
                    disabled={questionIndex === total - 1}
                    onClick={() => setQuestionIndex((i) => Math.min(total - 1, i + 1))}
                >
                    Câu sau
                </Button>
                <Button variant="cta" loading={submitting} onClick={handleSubmit}>
                    Nộp bài
                </Button>
            </div>
        </div>
    );
};

// UI_SPEC §3.3 mục 3 — render theo loại lesson: video player, tài liệu/text, hoặc quiz nhúng.
const LessonContentViewer = ({ lesson }: LessonContentViewerProps) => {
    // Lỗi tải khác lỗi dữ liệu (videoUrl rỗng ở nhánh dưới) — đây là lỗi runtime của thẻ <video>
    // (link hỏng, mạng lỗi...), cần nút "Tải lại" riêng theo UI_SPEC §3.3 Error state.
    const [videoLoadFailed, setVideoLoadFailed] = useState(false);
    // Đổi key để buộc React remount <video>, kích hoạt tải lại từ đầu khi bấm "Tải lại".
    const [videoReloadToken, setVideoReloadToken] = useState(0);

    if (lesson.contentType === "video") {
        return (
            <div className="space-y-4">
                {!lesson.videoUrl ? (
                    <EmptyState icon={AlertCircle} title="Không tải được video" description="Vui lòng thử lại sau." />
                ) : videoLoadFailed ? (
                    <EmptyState
                        icon={AlertCircle}
                        title="Không thể tải video"
                        description="Đã có lỗi khi tải video này, vui lòng thử lại."
                        action={
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setVideoLoadFailed(false);
                                    setVideoReloadToken((t) => t + 1);
                                }}
                            >
                                Tải lại
                            </Button>
                        }
                    />
                ) : (
                    <video
                        key={`${lesson.lessonId}-${videoReloadToken}`}
                        controls
                        src={lesson.videoUrl}
                        onError={() => setVideoLoadFailed(true)}
                        className="w-full rounded-radius-lg bg-surface-inverse"
                    />
                )}
            </div>
        );
    }

    if (lesson.contentType === "quiz") {
        return <LessonQuizViewer lessonId={lesson.lessonId} />;
    }

    return (
        <Card variant="app">
            <p className="text-body text-primary whitespace-pre-wrap">
                {lesson.content || "Nội dung đang được cập nhật."}
            </p>
        </Card>
    );
};

export default LessonContentViewer;
