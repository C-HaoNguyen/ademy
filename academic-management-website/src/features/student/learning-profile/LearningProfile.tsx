import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/config/constants";
import { useMyCoursesQuery } from "@/shared/api/queries/useMyCoursesQuery";
import { useQuizAttemptSummaryQuery } from "@/shared/api/queries/useStudentSummaryQuery";
import Card from "@/shared/ui/Card";
import StatCard from "@/shared/ui/StatCard";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";

const LearningProfile = () => {
    const { t } = useTranslation("student");
    const navigate = useNavigate();
    const quizAttemptSummaryQuery = useQuizAttemptSummaryQuery();
    const myCoursesQuery = useMyCoursesQuery();

    const courses = myCoursesQuery.data ?? [];
    const averageScore = quizAttemptSummaryQuery.data?.averageScore;

    return (
        <div className="space-y-8">
            <h1 className="text-h1 text-primary">{t("learningProfile.title")}</h1>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    icon={<BookOpen size={22} aria-hidden="true" />}
                    label={t("learningProfile.statTotalCourses")}
                    value={courses.length}
                    loading={myCoursesQuery.isLoading}
                />
                <StatCard
                    icon={<CheckCircle size={22} aria-hidden="true" />}
                    label={t("learningProfile.statTotalQuizAttempts")}
                    value={quizAttemptSummaryQuery.data?.attemptCount ?? 0}
                    loading={quizAttemptSummaryQuery.isLoading}
                />
                <StatCard
                    icon={<Award size={22} aria-hidden="true" />}
                    label={t("learningProfile.statAverageScore")}
                    value={averageScore != null ? averageScore.toFixed(1) : "—"}
                    loading={quizAttemptSummaryQuery.isLoading}
                />
            </div>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4">{t("learningProfile.detailByCourseTitle")}</h3>

                {myCoursesQuery.isLoading ? (
                    <SkeletonText lines={4} />
                ) : courses.length === 0 ? (
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
                        {courses.map((course) => (
                            <li key={course.courseId}>
                                <button
                                    type="button"
                                    onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                                    className="w-full flex items-center justify-between gap-4 rounded-radius-md border border-default p-3 text-left hover:bg-surface-muted transition-colors"
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
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default LearningProfile;
