import { useState } from "react";
import { Notebook, Eye, ShieldOff, UserX, BookX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/config/constants";
import { useAdminCoursesQuery, type AdminCourse } from "@/shared/api/queries/useAdminCoursesQuery";
import Badge from "@/shared/ui/Badge";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn } from "@/shared/ui/Table";
import { COURSE_STATUS_TONE, getCourseStatusLabel } from "@/shared/ui/courseStatus";
import ForceUnpublishModal from "../components/ForceUnpublishModal";
import RevokeAccessModal from "../components/RevokeAccessModal";

type SelectedCourse = { courseId: number; title: string };

const AdminCourses = () => {
    const { t } = useTranslation(["admin", "common"]);
    const coursesQuery = useAdminCoursesQuery();
    const courses = coursesQuery.data ?? [];

    const [forceUnpublishCourse, setForceUnpublishCourse] = useState<SelectedCourse | null>(null);
    const [revokeAccessCourse, setRevokeAccessCourse] = useState<SelectedCourse | null>(null);

    const columns: TableColumn<AdminCourse>[] = [
        {
            key: "title",
            header: t("courses.columnTitle"),
            render: (course) => <span className="font-medium text-primary">{course.title}</span>,
        },
        {
            key: "instructorFullName",
            header: t("courses.columnInstructor"),
            render: (course) => course.instructorFullName,
        },
        {
            key: "status",
            header: t("courses.columnStatus"),
            render: (course) => (
                <Badge variant="status" tone={COURSE_STATUS_TONE[course.status] ?? "info"}>
                    {getCourseStatusLabel(course.status, t)}
                </Badge>
            ),
        },
        {
            key: "studentCount",
            header: t("courses.columnStudentCount"),
            render: (course) => course.studentCount,
        },
        {
            key: "publishedAt",
            header: t("courses.columnPublishedAt"),
            render: (course) =>
                course.publishedAt ? new Date(course.publishedAt).toLocaleDateString("vi-VN") : "—",
        },
        {
            key: "actions",
            header: t("courses.columnActions"),
            render: (course) => (
                <div className="flex items-center gap-1">
                    <a
                        href={ROUTES.COURSE_DETAIL(String(course.courseId))}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer p-2 rounded-radius-md text-secondary hover:bg-surface-muted transition-colors"
                        title={t("courses.view")}
                        aria-label={t("courses.viewAria", { title: course.title })}
                    >
                        <Eye size={16} aria-hidden="true" />
                    </a>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setForceUnpublishCourse({ courseId: course.courseId, title: course.title });
                        }}
                        className="cursor-pointer p-2 rounded-radius-md text-status-danger-text hover:bg-status-danger-bg transition-colors"
                        title={t("courses.forceUnpublish")}
                        aria-label={t("courses.forceUnpublishAria", { title: course.title })}
                    >
                        <ShieldOff size={16} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setRevokeAccessCourse({ courseId: course.courseId, title: course.title });
                        }}
                        className="cursor-pointer p-2 rounded-radius-md text-status-danger-text hover:bg-status-danger-bg transition-colors"
                        title={t("courses.revokeAccess")}
                        aria-label={t("courses.revokeAccessAria", { title: course.title })}
                    >
                        <UserX size={16} aria-hidden="true" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="flex items-center gap-3 text-h2 text-primary">
                    <Notebook size={24} aria-hidden="true" />
                    {t("courses.title")}
                </h2>
                <p className="text-body-sm text-secondary mt-1">
                    {t("courses.subtitle")}
                </p>
            </div>

            <Table
                columns={columns}
                data={courses}
                rowKey={(course) => course.courseId}
                loading={coursesQuery.isLoading}
                emptyState={<EmptyState icon={BookX} title={t("courses.emptyTitle")} />}
            />

            <ForceUnpublishModal
                open={forceUnpublishCourse !== null}
                onClose={() => setForceUnpublishCourse(null)}
                course={forceUnpublishCourse}
            />

            <RevokeAccessModal
                open={revokeAccessCourse !== null}
                onClose={() => setRevokeAccessCourse(null)}
                course={revokeAccessCourse}
            />
        </div>
    );
};

export default AdminCourses;
