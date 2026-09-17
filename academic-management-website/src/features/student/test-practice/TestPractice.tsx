import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { useCourseTestsQuery } from "@/shared/api/queries/useCourseTestsQuery";
import Card from "@/shared/ui/Card";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";
import { useToast } from "@/shared/ui/useToast";

const TestPractice = () => {
    const { t } = useTranslation("student");
    const navigate = useNavigate();
    const { showToast } = useToast();
    const testsQuery = useCourseTestsQuery();
    const tests = testsQuery.data ?? [];

    useEffect(() => {
        if (testsQuery.isError) {
            showToast({ tone: "danger", message: t("testPractice.loadErrorToast") });
        }
    }, [testsQuery.isError, showToast, t]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-h1 text-primary">{t("testPractice.title")}</h1>
                <p className="text-body-sm text-secondary mt-1">
                    {t("testPractice.subtitle")}
                </p>
            </div>

            {testsQuery.isLoading ? (
                <Card variant="app">
                    <SkeletonText lines={6} />
                </Card>
            ) : testsQuery.isError ? (
                <EmptyState
                    icon={ClipboardList}
                    title={t("testPractice.loadErrorTitle")}
                    description={t("testPractice.loadErrorDescription")}
                    action={
                        <Button variant="primary" size="sm" onClick={() => testsQuery.refetch()}>
                            {t("testPractice.retry")}
                        </Button>
                    }
                />
            ) : tests.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title={t("testPractice.emptyTitle")}
                    description={t("testPractice.emptyDescription")}
                    action={
                        <Button variant="primary" onClick={() => navigate(ROUTES.COURSES)}>
                            {t("testPractice.exploreCourses")}
                        </Button>
                    }
                />
            ) : (
                <ul className="space-y-3">
                    {tests.map((test) => (
                        <li key={test.quizId}>
                            <Card variant="app" className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-body font-medium text-primary truncate">
                                        {test.quizTitle}
                                    </p>
                                    <p className="text-body-sm text-secondary truncate">{test.courseTitle}</p>
                                    <div className="mt-2">
                                        {test.attempted ? (
                                            <Badge variant="status" tone="success">
                                                {t("testPractice.completedWithScore", { score: test.bestScore?.toFixed(1) ?? "—" })}
                                            </Badge>
                                        ) : (
                                            <Badge variant="status" tone="warning">{t("testPractice.notAttempted")}</Badge>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant={test.attempted ? "secondary" : "primary"}
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => navigate(ROUTES.STUDENT.QUIZ_COURSE(test.courseId))}
                                >
                                    {test.attempted ? t("testPractice.viewResult") : t("testPractice.startTest")}
                                </Button>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TestPractice;
