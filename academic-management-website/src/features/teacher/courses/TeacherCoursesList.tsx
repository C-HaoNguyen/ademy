import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Eye, BookOpen } from "lucide-react";
import { ROUTES } from "@/config/constants";
import {
    useTeacherCoursesQuery,
    useTeacherStudentCountsQuery,
    type TeacherCourse,
} from "@/shared/api/queries/useTeacherCoursesQuery";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn, type TableSort } from "@/shared/ui/Table";

type StatusFilter = "all" | "draft" | "published" | "archived";

const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "draft", label: "Draft" },
    { key: "published", label: "Published" },
    { key: "archived", label: "Archived" },
];

const statusTone: Record<string, "success" | "warning" | "danger"> = {
    published: "success",
    draft: "warning",
    archived: "danger",
};

const statusLabel: Record<string, string> = {
    published: "Published",
    draft: "Draft",
    archived: "Archived",
};

const TeacherCoursesList = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortBy, setSortBy] = useState<TableSort | undefined>(undefined);

    const coursesQuery = useTeacherCoursesQuery();
    const studentCountsQuery = useTeacherStudentCountsQuery();

    const studentCountByCourseId = useMemo(() => {
        const map = new Map<number, number>();
        for (const entry of studentCountsQuery.data ?? []) {
            map.set(entry.courseId, entry.studentCount);
        }
        return map;
    }, [studentCountsQuery.data]);

    const filteredCourses = useMemo(() => {
        const all = coursesQuery.data ?? [];
        const filtered = statusFilter === "all" ? all : all.filter((c) => c.status === statusFilter);

        if (!sortBy) return filtered;

        const sorted = [...filtered].sort((a, b) => {
            let result = 0;
            if (sortBy.key === "title") {
                result = a.title.localeCompare(b.title);
            } else if (sortBy.key === "status") {
                result = a.status.localeCompare(b.status);
            } else if (sortBy.key === "updatedAt") {
                result = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            }
            return sortBy.direction === "asc" ? result : -result;
        });
        return sorted;
    }, [coursesQuery.data, statusFilter, sortBy]);

    const columns: TableColumn<TeacherCourse>[] = [
        {
            key: "title",
            header: "Tên khóa học",
            sortable: true,
            render: (course) => <span className="font-medium text-primary">{course.title}</span>,
        },
        {
            key: "status",
            header: "Trạng thái",
            sortable: true,
            render: (course) => (
                <Badge variant="status" tone={statusTone[course.status] ?? "info"}>
                    {statusLabel[course.status] ?? course.status}
                </Badge>
            ),
        },
        {
            key: "studentCount",
            header: "Số học viên",
            render: (course) => studentCountByCourseId.get(course.courseId) ?? 0,
        },
        {
            key: "updatedAt",
            header: "Ngày cập nhật",
            sortable: true,
            render: (course) => new Date(course.updatedAt).toLocaleDateString("vi-VN"),
        },
        {
            key: "actions",
            header: "Action",
            render: (course) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(ROUTES.TEACHER.COURSE_EDIT(course.courseId));
                        }}
                        className="cursor-pointer p-2 rounded-radius-md text-brand hover:bg-surface-brand-muted transition-colors"
                        title="Sửa"
                        aria-label={`Sửa khóa học ${course.title}`}
                    >
                        <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(ROUTES.COURSE_DETAIL(String(course.courseId)));
                        }}
                        className="cursor-pointer p-2 rounded-radius-md text-secondary hover:bg-surface-muted transition-colors"
                        title="Xem"
                        aria-label={`Xem khóa học ${course.title}`}
                    >
                        <Eye size={16} aria-hidden="true" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-h2 text-primary">Khóa học của tôi</h2>
                    <p className="text-body-sm text-secondary mt-1">
                        Quản lý toàn bộ khóa học bạn đang giảng dạy
                    </p>
                </div>
                <Button variant="primary" iconLeft={Plus} onClick={() => navigate(ROUTES.TEACHER.COURSE_NEW)}>
                    Tạo khóa học mới
                </Button>
            </div>

            <div className="flex gap-2">
                {statusFilters.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => setStatusFilter(f.key)}
                        className={`px-3 py-1.5 rounded-radius-full text-body-sm font-medium transition-colors ${
                            statusFilter === f.key
                                ? "bg-nav-selected-bg text-nav-selected-text"
                                : "text-secondary hover:bg-surface-muted"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <Table
                columns={columns}
                data={filteredCourses}
                rowKey={(course) => course.courseId}
                loading={coursesQuery.isLoading}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onRowClick={(course) => navigate(ROUTES.TEACHER.COURSE_EDIT(course.courseId))}
                emptyState={
                    <EmptyState
                        icon={BookOpen}
                        title="Bạn chưa có khóa học nào"
                        description="Tạo khóa học mới để bắt đầu xây dựng nội dung."
                        action={
                            <Button variant="primary" iconLeft={Plus} onClick={() => navigate(ROUTES.TEACHER.COURSE_NEW)}>
                                Tạo khóa học mới
                            </Button>
                        }
                    />
                }
            />
        </div>
    );
};

export default TeacherCoursesList;
