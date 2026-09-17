import { BookOpen, CheckCircle, TrendingUp, PlayCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/config/constants";
import { useMyCoursesQuery } from "@/shared/api/queries/useMyCoursesQuery";
import { useStudentDashboardSummaryQuery, useQuizAttemptSummaryQuery } from "@/shared/api/queries/useStudentSummaryQuery";
import Card from "@/shared/ui/Card";
import StatCard from "@/shared/ui/StatCard";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";

const Dashboard = () => {
    const { t } = useTranslation("student");
    const navigate = useNavigate();
    const summaryQuery = useStudentDashboardSummaryQuery();
    const quizAttemptSummaryQuery = useQuizAttemptSummaryQuery();
    const myCoursesQuery = useMyCoursesQuery();
    const averageProgressPercent = summaryQuery.data?.averageProgressPercent;

    const recentCourses = [...(myCoursesQuery.data ?? [])]
        .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-h2 text-primary">{t("dashboard.title")}</h2>
                <p className="text-body-sm text-secondary mt-1">
                    {t("dashboard.subtitle")}
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={<BookOpen size={22} aria-hidden="true" />}
                    label={t("dashboard.statEnrolledCourses")}
                    value={summaryQuery.data?.totalCourses ?? 0}
                    loading={summaryQuery.isLoading}
                />
                <StatCard
                    icon={<CheckCircle size={22} aria-hidden="true" />}
                    label={t("dashboard.statQuizAttempts")}
                    value={quizAttemptSummaryQuery.data?.attemptCount ?? 0}
                    loading={quizAttemptSummaryQuery.isLoading}
                />
                <StatCard
                    icon={<TrendingUp size={22} aria-hidden="true" />}
                    label={t("dashboard.statAverageProgress")}
                    value={averageProgressPercent != null ? `${averageProgressPercent}%` : "—"}
                    loading={summaryQuery.isLoading}
                />
            </div>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <PlayCircle size={18} aria-hidden="true" />
                    {t("dashboard.continueLearning")}
                </h3>

                {myCoursesQuery.isLoading ? (
                    <SkeletonText lines={3} />
                ) : recentCourses.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title={t("dashboard.emptyTitle")}
                        description={t("dashboard.emptyDescription")}
                        action={
                            <Button variant="primary" onClick={() => navigate(ROUTES.COURSES)}>
                                {t("dashboard.exploreCourses")}
                            </Button>
                        }
                    />
                ) : (
                    <ul className="space-y-3">
                        {recentCourses.map((course) => (
                            <li
                                key={course.courseId}
                                className="flex items-center justify-between gap-4 rounded-radius-md border border-default p-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-body font-medium text-primary truncate">
                                        {course.title}
                                    </p>
                                    {course.instructorName && (
                                        <p className="text-body-sm text-secondary truncate">
                                            {course.instructorName}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate(ROUTES.STUDENT.LEARN(course.courseId))}
                                >
                                    {t("dashboard.goToLearning")}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <Zap size={18} aria-hidden="true" />
                    {t("dashboard.quickActions")}
                </h3>

                <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}>
                        {t("dashboard.continueLearning")}
                    </Button>
                    <Button variant="cta" onClick={() => navigate(ROUTES.COURSES)}>
                        {t("dashboard.exploreCourses")}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT.PROFILE)}>
                        {t("dashboard.personalProfile")}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
