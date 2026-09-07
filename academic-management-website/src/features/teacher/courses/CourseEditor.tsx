import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import {
    useTeacherCourseQuery,
    teacherCourseQueryKey,
    teacherCoursesQueryKey,
    type TeacherCourse,
} from "@/shared/api/queries/useTeacherCoursesQuery";
import { useToast } from "@/shared/ui/useToast";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Tabs, { type TabItem } from "@/shared/ui/Tabs";
import { SkeletonText } from "@/shared/ui/Skeleton";
import OverviewTab from "./tabs/OverviewTab";
import CurriculumTab from "./tabs/CurriculumTab";
import QuizTab from "./tabs/QuizTab";
import StudentsTab from "./tabs/StudentsTab";
import SettingsTab from "./tabs/SettingsTab";

type CourseStatus = "draft" | "published" | "archived";

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

const nextQuickStatus: Record<string, { status: CourseStatus; label: string }> = {
    draft: { status: "published", label: "Publish" },
    published: { status: "archived", label: "Archive" },
    archived: { status: "published", label: "Xuất bản lại" },
};

const CourseEditor = () => {
    const { courseId: courseIdParam } = useParams();
    const isNew = courseIdParam === undefined;
    const courseId = isNew ? undefined : Number(courseIdParam);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const courseQuery = useTeacherCourseQuery(courseId);
    const course = courseQuery.data;

    const [activeTab, setActiveTab] = useState("overview");
    const [changingStatus, setChangingStatus] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const invalidateCourse = () => {
        queryClient.invalidateQueries({ queryKey: teacherCoursesQueryKey });
        if (courseId !== undefined) {
            queryClient.invalidateQueries({ queryKey: teacherCourseQueryKey(courseId) });
        }
    };

    const handleOverviewSaved = (savedCourse: TeacherCourse) => {
        invalidateCourse();
        if (isNew) {
            navigate(ROUTES.TEACHER.COURSE_EDIT(savedCourse.courseId), { replace: true });
        }
    };

    const buildStatusUpdatePayload = (current: TeacherCourse, status: CourseStatus) => ({
        title: current.title,
        description: current.description ?? "",
        categoryId: current.category?.categoryId,
        thumbnail: current.thumbnail ?? "",
        price: current.price,
        level: current.level ?? "beginner",
        status,
    });

    const handleChangeStatus = async (status: CourseStatus) => {
        if (!course || courseId === undefined) return;

        setChangingStatus(true);
        try {
            const res = await apiClient(API_ENDPOINTS.TEACHER.COURSE_DETAIL(courseId), {
                method: "PUT",
                body: JSON.stringify(buildStatusUpdatePayload(course, status)),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                showToast({ tone: "danger", message: data?.message || "Đổi trạng thái thất bại" });
                return;
            }

            showToast({
                tone: "success",
                message: status === "published" ? "Khóa học đã được xuất bản" : "Đã cập nhật trạng thái",
            });
            invalidateCourse();
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setChangingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (courseId === undefined) return;

        setDeleting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.TEACHER.COURSE_DETAIL(courseId), { method: "DELETE" });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                showToast({ tone: "danger", message: data?.message || "Xóa khóa học thất bại" });
                return;
            }

            showToast({ tone: "success", message: "Đã xóa khóa học" });
            queryClient.invalidateQueries({ queryKey: teacherCoursesQueryKey });
            navigate(ROUTES.TEACHER.COURSES);
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setDeleting(false);
        }
    };

    // Curriculum/Quiz/Học viên/Cài đặt đều cần courseId đã tồn tại (lesson/quiz/enrollment endpoint
    // đều nhận courseId trong path) — không chỉ riêng tab Học viên như UI_SPEC §4.3 nêu, vì chưa lưu
    // Tổng quan thì chưa có courseId để các tab này gọi API.
    const tabs: TabItem[] = [
        { key: "overview", label: "Tổng quan" },
        { key: "curriculum", label: "Curriculum", disabled: isNew },
        { key: "quiz", label: "Quiz (test tổng)", disabled: isNew },
        { key: "students", label: "Học viên", disabled: isNew },
        { key: "settings", label: "Cài đặt", disabled: isNew },
    ];

    if (!isNew && courseQuery.isLoading) {
        return <SkeletonText lines={8} />;
    }

    if (!isNew && courseQuery.isError) {
        return <p className="text-body text-secondary">Không tải được khóa học.</p>;
    }

    const quickAction = course ? nextQuickStatus[course.status] : undefined;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-h2 text-primary">{course ? course.title : "Tạo khóa học mới"}</h2>
                    {course && (
                        <Badge variant="status" tone={statusTone[course.status] ?? "info"}>
                            {statusLabel[course.status] ?? course.status}
                        </Badge>
                    )}
                </div>
                {course && quickAction && (
                    <Button
                        variant={quickAction.status === "published" ? "cta" : "secondary"}
                        loading={changingStatus}
                        onClick={() => handleChangeStatus(quickAction.status)}
                    >
                        {quickAction.label}
                    </Button>
                )}
            </div>

            <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab}>
                <div className="mt-4">
                    {activeTab === "overview" && (
                        <OverviewTab course={course} courseId={courseId} onSaved={handleOverviewSaved} />
                    )}
                    {activeTab === "curriculum" && courseId !== undefined && <CurriculumTab courseId={courseId} />}
                    {activeTab === "quiz" && courseId !== undefined && <QuizTab courseId={courseId} />}
                    {activeTab === "students" && courseId !== undefined && <StudentsTab courseId={courseId} />}
                    {activeTab === "settings" && courseId !== undefined && course && (
                        <SettingsTab
                            course={course}
                            changingStatus={changingStatus}
                            onChangeStatus={handleChangeStatus}
                            deleting={deleting}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </Tabs>
        </div>
    );
};

export default CourseEditor;
