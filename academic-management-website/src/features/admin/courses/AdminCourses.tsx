import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Notebook, Pencil, Trash2, Plus, BookX } from "lucide-react";
import AddCourseOverlay, { type CreateCoursePayload } from "../components/AddCourseOverlay";
import Toast from "../../../shared/ui/Toast";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { SkeletonTable } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import { useAdminCoursesQuery, adminCoursesQueryKey, type AdminCourse } from "@/shared/api/queries/useAdminCoursesQuery";
import { useAdminCategoriesQuery } from "@/shared/api/queries/useAdminCategoriesQuery";

const AdminCourses = () => {
    const queryClient = useQueryClient();
    const [showAddCourseOverlay, setShowAddCourseOverlay] = useState(false);
    const [showEditCourseOverlay, setShowEditCourseOverlay] = useState(false);
    const [showDeleteCourseOverlay, setShowDeleteCourseOverlay] = useState(false);
    type ToastType = "success" | "error";

    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
    } | null>(null);

    const [deletedCourse, setDeletedCourse] = useState<{
        courseId: number;
        title: string
    } | null>(null);

    const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);

    const coursesQuery = useAdminCoursesQuery();
    const courses = coursesQuery.data ?? [];
    const loading = coursesQuery.isLoading;

    const categoriesQuery = useAdminCategoriesQuery();
    const categories = categoriesQuery.data ?? [];

    const [instructors, setInstructors] = useState<
        { userId: number; fullName: string }[]
    >([]);

    useEffect(() => {
        fetchInstructors();
    }, []);

    async function fetchInstructors() {
        const res = await apiClient(API_ENDPOINTS.INSTRUCTORS.LIST);

        if (!res.ok) return;

        const data = await res.json();
        setInstructors(data);
    }

    const showToast = (type: ToastType, message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateCourse = async (formData: CreateCoursePayload) => {
        try {
            const res = await apiClient(API_ENDPOINTS.COURSES.ADMIN_ADD, {
                method: "POST",
                body: JSON.stringify(formData),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                showToast("error", data?.message || "Thêm khóa học thất bại");
                return;
            }

            showToast("success", "Thêm khóa học thành công!");
            setShowAddCourseOverlay(false);
            queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
        } catch (err) {
            console.error(err);
            showToast("error", "Lỗi kết nối server");
        }
    };

    const handleEditCourse = (course: AdminCourse) => {
        setEditingCourse(course);
        setShowEditCourseOverlay(true);
    };

    const handleSubmitEditCourse = async (formData: CreateCoursePayload) => {
        if (!editingCourse) return;

        try {
            const res = await apiClient(API_ENDPOINTS.COURSES.ADMIN_DETAIL(editingCourse.courseId), {
                method: "PUT",
                body: JSON.stringify(formData),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                showToast("error", data?.message || "Cập nhật khóa học thất bại");
                return;
            }

            showToast("success", "Đã cập nhật khóa học");
            setShowEditCourseOverlay(false);
            setEditingCourse(null);
            queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
        } catch (err) {
            console.error(err);
            showToast("error", "Lỗi kết nối server");
        }
    };

    const handleDeleteCourse = async () => {
        if (!deletedCourse) return;

        try {
            const res = await apiClient(
                `${API_ENDPOINTS.COURSES.ADMIN_DELETE}/${deletedCourse.courseId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                console.error("Delete failed:", res.status);
                showToast("error", "Xóa khóa học thất bại");
                return;
            }

            setShowDeleteCourseOverlay(false);
            setDeletedCourse(null);
            showToast("success", "Đã xóa khóa học");
            queryClient.invalidateQueries({ queryKey: adminCoursesQueryKey });
        } catch (err) {
            console.error(err);
            showToast("error", "Xóa khóa học thất bại");
        }
    };

    return (
        <div>
            <h2 className="flex items-center text-2xl text-primary font-semibold mb-4 gap-3">
                <Notebook size={24} aria-hidden="true" />
                Quản lý khóa học
            </h2>

            <AddCourseOverlay
                open={showAddCourseOverlay}
                onClose={() => setShowAddCourseOverlay(false)}
                onSubmit={handleCreateCourse}
                instructors={instructors}
                categories={categories}
            />

            <AddCourseOverlay
                open={showEditCourseOverlay}
                onClose={() => {
                    setShowEditCourseOverlay(false);
                    setEditingCourse(null);
                }}
                onSubmit={handleSubmitEditCourse}
                instructors={instructors}
                categories={categories}
                mode="edit"
                initialValues={
                    editingCourse
                        ? {
                            title: editingCourse.title,
                            description: editingCourse.description ?? "",
                            instructorId: editingCourse.instructor.userId,
                            categoryId: editingCourse.category?.categoryId,
                            price: editingCourse.price,
                            thumbnail: editingCourse.thumbnail ?? "",
                            level: editingCourse.level as CreateCoursePayload["level"],
                            status: editingCourse.status as CreateCoursePayload["status"],
                        }
                        : undefined
                }
            />

            <div className="flex items-center justify-start mb-4">
                <button
                    type="button"
                    onClick={() => setShowAddCourseOverlay(true)}
                    className="cursor-pointer group flex items-center gap-2 px-3 py-2 rounded-xl bg-cta
                                text-white text-sm font-semibold shadow-sm hover:bg-cta-dark hover:shadow-md
                                transition-all duration-200"
                >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-200">
                        <Plus size={16} aria-hidden="true" />
                    </span>

                    Thêm khóa học
                </button>
            </div>

            {
                showDeleteCourseOverlay && deletedCourse && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-card shadow-xl w-[440px] p-6 animate-fadeIn">
                            {/* Header */}
                            <h2 className="text-2xl font-semibold text-danger mb-3">
                                Xóa khóa học
                            </h2>

                            {/* Content */}
                            <p className="text-slate-700 leading-relaxed mb-6">
                                Bạn sắp xóa khóa học{" "}
                                <span className="font-semibold text-danger">
                                    {deletedCourse.title}
                                </span>
                                .
                                <br />
                                <span className="text-sm text-slate-500">
                                    Hành động này sẽ <b>không thể hoàn tác</b>. Bạn có chắc chắn muốn tiếp tục?
                                </span>
                            </p>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteCourseOverlay(false)}
                                    className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDeleteCourse}
                                    className="cursor-pointer px-5 py-2.5 rounded-lg bg-danger text-white hover:bg-red-700 transition-colors duration-200"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="bg-white rounded-card shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-sm">
                        <colgroup>
                            <col className="w-16" />
                            <col className="w-[320px]" />
                            <col className="w-32" />
                            <col className="w-40" />
                            <col className="w-44" />
                            <col className="w-28" />
                            <col className="w-32" />
                            <col className="w-32" />
                            <col className="w-48" />
                            <col className="w-24" />
                        </colgroup>

                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-center text-slate-600">
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Tên khóa học</th>
                                <th className="px-4 py-3 font-medium">Hình ảnh</th>
                                <th className="px-4 py-3 font-medium">Phân loại</th>
                                <th className="px-4 py-3 font-medium">Tên giáo viên</th>
                                <th className="px-4 py-3 font-medium">Mức độ</th>
                                <th className="px-4 py-3 font-medium">Giá</th>
                                <th className="px-4 py-3 font-medium">Trạng thái</th>
                                <th className="px-4 py-3 font-medium text-center">
                                    <div className="leading-tight">
                                        <div>Created at</div>
                                        <div>Updated at</div>
                                    </div>
                                </th>
                                <th className="px-4 py-3 font-medium">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <SkeletonTable rows={6} columns={10} />
                            ) : (
                                courses.map((course) => (
                                    <tr
                                        key={course.courseId}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                                    >
                                        <td className="text-center px-4 py-3">{course.courseId}</td>
                                        <td className="px-4 py-3 align-middle">
                                            <div className="flex items-center justify-center h-full">
                                                <p className="line-clamp-2 font-medium text-ink text-center">
                                                    {course.title}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-20 h-12 object-contain rounded-md mx-auto"
                                                />
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No image</span>
                                            )}
                                        </td>
                                        <td className="text-center px-4 py-3 truncate">
                                            {course.category?.categoryName}
                                        </td>
                                        <td className="text-center px-4 py-3 truncate">
                                            {course.instructor.fullName}
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700">
                                                {course.level}
                                            </span>
                                        </td>
                                        <td className="text-center px-4 py-3 font-medium text-ink">
                                            {course.price.toLocaleString()} đ
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${course.status === "published"
                                                    ? "bg-success-light text-success"
                                                    : course.status === "draft"
                                                        ? "bg-warning-light text-warning"
                                                        : "bg-danger-light text-danger"
                                                    }`}
                                            >
                                                {course.status === "published"
                                                    ? "Published"
                                                    : course.status === "draft"
                                                        ? "Draft"
                                                        : "Archived"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-center text-slate-500">
                                            <div>{course.createdAt}</div>
                                            <div className="mt-1 text-primary">{course.updatedAt}</div>
                                        </td>

                                        {/* Action */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditCourse(course)}
                                                    className="cursor-pointer p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors duration-200"
                                                    title="Edit"
                                                    aria-label="Sửa khóa học"
                                                >
                                                    <Pencil size={16} aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeletedCourse(course);
                                                        setShowDeleteCourseOverlay(true);
                                                    }}
                                                    className="cursor-pointer p-2 rounded-lg text-danger hover:bg-danger-light transition-colors duration-200"
                                                    title="Delete"
                                                    aria-label="Xóa khóa học"
                                                >
                                                    <Trash2 size={16} aria-hidden="true" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {!loading && courses.length === 0 && (
                        <div className="p-8">
                            <EmptyState
                                icon={BookX}
                                title="Chưa có khóa học nào"
                                description="Thêm khóa học đầu tiên để bắt đầu xây dựng nội dung."
                            />
                        </div>
                    )}
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default AdminCourses;
