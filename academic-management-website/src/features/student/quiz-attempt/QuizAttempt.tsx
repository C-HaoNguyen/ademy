import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient, readErrorMessage } from "@/shared/api/client";
import { useCourseQuizQuery } from "@/shared/api/queries/useCourseQuizQuery";
import { useToast } from "@/shared/ui/useToast";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";
import RadioCardGroup from "@/shared/ui/RadioCardGroup";
import { AlertCircle } from "lucide-react";

type AttemptResult = {
    attemptId: number;
    quizId: number;
    score: number;
    correctCount: number;
    totalQuestions: number;
    submittedAt: string;
};

const QuizAttempt = () => {
    const { t } = useTranslation("student");
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const quizQuery = useCourseQuizQuery(courseId);

    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<AttemptResult | null>(null);

    const quiz = quizQuery.data;
    const questions = quiz?.questions ?? [];
    const currentQuestion = questions[questionIndex];
    const total = questions.length;

    const handleSubmit = async () => {
        if (!quiz) return;
        if (Object.keys(answers).length === 0) {
            showToast({ tone: "danger", message: t("quizAttempt.atLeastOneAnswer") });
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
                showToast({ tone: "danger", message: await readErrorMessage(res, t("quizAttempt.submitFailed")) });
                return;
            }

            setResult(await res.json());
        } catch {
            showToast({ tone: "danger", message: t("quizAttempt.connectionError") });
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
                title={t("quizAttempt.loadErrorTitle")}
                description={t("quizAttempt.loadErrorDescription")}
                action={
                    <Button variant="primary" onClick={() => navigate(ROUTES.STUDENT.TEST_PRACTICE)}>
                        {t("quizAttempt.back")}
                    </Button>
                }
            />
        );
    }

    if (result) {
        return (
            <Card variant="app" className="max-w-xl mx-auto text-center space-y-4">
                <h1 className="text-h2 text-primary" aria-live="polite">
                    {t("quizAttempt.resultTitle", { score: result.score.toFixed(1) })}
                </h1>
                <p className="text-body text-secondary">
                    {t("quizAttempt.resultCorrect", { correct: result.correctCount, total: result.totalQuestions })}
                </p>
                <Button variant="primary" onClick={() => navigate(ROUTES.STUDENT.TEST_PRACTICE)}>
                    {t("quizAttempt.back")}
                </Button>
            </Card>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <h1 className="text-h2 text-primary">{quiz.title}</h1>
                <p className="text-body-sm text-secondary mt-1" aria-live="polite">
                    {t("quizAttempt.questionProgress", { current: questionIndex + 1, total })}
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
                    {t("quizAttempt.prevQuestion")}
                </Button>
                <Button
                    variant="secondary"
                    disabled={questionIndex === total - 1}
                    onClick={() => setQuestionIndex((i) => Math.min(total - 1, i + 1))}
                >
                    {t("quizAttempt.nextQuestion")}
                </Button>
                <Button variant="cta" loading={submitting} onClick={handleSubmit}>
                    {t("quizAttempt.submit")}
                </Button>
            </div>
        </div>
    );
};

export default QuizAttempt;
