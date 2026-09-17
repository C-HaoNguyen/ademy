import { BookOpen, Users, FileEdit, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/config/constants";
import { useTeacherCoursesQuery, useTeacherStudentCountsQuery } from "@/shared/api/queries/useTeacherCoursesQuery";
import Card from "@/shared/ui/Card";
import StatCard from "@/shared/ui/StatCard";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";

const TeacherDashboard = () => {
    const { t } = useTranslation("teacher");
    const navigate = useNavigate();

    const coursesQuery = useTeacherCoursesQuery();
    const studentCountsQuery = useTeacherStudentCountsQuery();

    const courses = coursesQuery.data ?? [];
    const draftCourses = courses.filter((c) => c.status === "draft");
    const totalStudents = (studentCountsQuery.data ?? []).reduce((sum, c) => sum + c.studentCount, 0);

    if (!coursesQuery.isLoading && !coursesQuery.isError && courses.length === 0) {
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-h2 text-primary">{t("dashboard.title")}</h2>
                    <p className="text-body-sm text-secondary mt-1">{t("dashboard.subtitle")}</p>
                </div>
                <EmptyState
                    icon={BookOpen}
                    title={t("dashboard.emptyTitle")}
                    description={t("dashboard.emptyDescription")}
                    action={
                        <Button variant="primary" iconLeft={Plus} onClick={() => navigate(ROUTES.TEACHER.COURSE_NEW)}>
                            {t("dashboard.createFirstCourse")}
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-h2 text-primary">{t("dashboard.title")}</h2>
                <p className="text-body-sm text-secondary mt-1">{t("dashboard.subtitle")}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    icon={<BookOpen size={22} aria-hidden="true" />}
                    label={t("dashboard.statTotalCourses")}
                    value={coursesQuery.isError ? "—" : courses.length}
                    loading={coursesQuery.isLoading}
                />
                <StatCard
                    icon={<Users size={22} aria-hidden="true" />}
                    label={t("dashboard.statTotalStudents")}
                    value={studentCountsQuery.isError ? "—" : totalStudents}
                    loading={studentCountsQuery.isLoading}
                />
                <StatCard
                    icon={<FileEdit size={22} aria-hidden="true" />}
                    label={t("dashboard.statDraftCourses")}
                    value={coursesQuery.isError ? "—" : draftCourses.length}
                    loading={coursesQuery.isLoading}
                />
            </div>

            <Card variant="app">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-primary flex items-center gap-2">
                        <FileEdit size={18} aria-hidden="true" />
                        {t("dashboard.coursesNeedAttention")}
                    </h3>
                    <Button variant="tertiary" size="sm" onClick={() => navigate(ROUTES.TEACHER.COURSES)}>
                        {t("dashboard.viewAll")}
                    </Button>
                </div>

                {coursesQuery.isLoading ? (
                    <SkeletonText lines={3} />
                ) : coursesQuery.isError ? (
                    <p className="text-body-sm text-secondary">—</p>
                ) : draftCourses.length === 0 ? (
                    <EmptyState icon={FileEdit} title={t("dashboard.noPendingPublish")} />
                ) : (
                    <ul className="space-y-3">
                        {draftCourses.map((course) => (
                            <li
                                key={course.courseId}
                                className="flex items-center justify-between gap-4 rounded-radius-md border border-default p-3 cursor-pointer hover:bg-surface-muted"
                                onClick={() => navigate(ROUTES.TEACHER.COURSE_EDIT(course.courseId))}
                            >
                                <div className="min-w-0">
                                    <p className="text-body font-medium text-primary truncate">{course.title}</p>
                                </div>
                                <Badge variant="status" tone="warning">
                                    {t("courseStatus.draft")}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default TeacherDashboard;
