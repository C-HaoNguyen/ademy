import { useEffect, useState } from "react";
import { FolderKanban, Pencil, Trash2, Plus, FolderX } from "lucide-react";
import { getAccessToken } from "../../../utils/AuthUtils";
import { authFetch } from "../../../utils/AuthFetch";
import { API_URL } from "@/config/constants";
import { SkeletonTable } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import Toast from "@/shared/ui/Toast";
import CategoryOverlay, { type CategoryPayload } from "@/features/admin/components/CategoryOverlay";

type Category = {
    categoryId: number;
    categoryName: string;
    description: string | null;
};

const AdminCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [courseCountByCategory, setCourseCountByCategory] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);

    const [showAddOverlay, setShowAddOverlay] = useState(false);
    const [showEditOverlay, setShowEditOverlay] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [showDeleteOverlay, setShowDeleteOverlay] = useState(false);
    const [deletedCategory, setDeletedCategory] = useState<Category | null>(null);

    type ToastType = "success" | "error";
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (type: ToastType, message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        refreshCategories();
        fetchCourseCounts();
    }, []);

    async function refreshCategories() {
        setLoading(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_URL}/admin/categories`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                console.error("API error:", res.status);
                return;
            }

            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchCourseCounts() {
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_URL}/admin/courses`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) return;

            const data: { category?: { categoryId: number } | null }[] = await res.json();
            const counts: Record<number, number> = {};
            data.forEach((course) => {
                const id = course.category?.categoryId;
                if (id != null) {
                    counts[id] = (counts[id] ?? 0) + 1;
                }
            });
            setCourseCountByCategory(counts);
        } catch (err) {
            console.error(err);
        }
    }

    const handleCreate = async (form: CategoryPayload) => {
        try {
            const token = getAccessToken();
            const res = await authFetch(`${API_URL}/admin/categories/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const message = await res.text().catch(() => "");
                showToast("error", message || "Thêm danh mục thất bại");
                return;
            }

            showToast("success", "Đã thêm danh mục mới");
            setShowAddOverlay(false);
            refreshCategories();
        } catch (err) {
            console.error(err);
            showToast("error", "Lỗi kết nối server");
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setShowEditOverlay(true);
    };

    const handleSubmitEdit = async (form: CategoryPayload) => {
        if (!editingCategory) return;

        try {
            const token = getAccessToken();
            const res = await authFetch(`${API_URL}/admin/categories/${editingCategory.categoryId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const message = await res.text().catch(() => "");
                showToast("error", message || "Cập nhật danh mục thất bại");
                return;
            }

            showToast("success", "Đã cập nhật danh mục");
            setShowEditOverlay(false);
            setEditingCategory(null);
            refreshCategories();
        } catch (err) {
            console.error(err);
            showToast("error", "Lỗi kết nối server");
        }
    };

    const handleDelete = async () => {
        if (!deletedCategory) return;

        try {
            const token = getAccessToken();
            const res = await authFetch(`${API_URL}/admin/categories/${deletedCategory.categoryId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                showToast("error", "Xóa danh mục thất bại");
                return;
            }

            showToast("success", "Đã xóa danh mục");
            setShowDeleteOverlay(false);
            setDeletedCategory(null);
            refreshCategories();
        } catch (err) {
            console.error(err);
            showToast("error", "Xóa danh mục thất bại");
        }
    };

    return (
        <div>
            <h2 className="flex items-center text-2xl text-primary font-semibold mb-4 gap-3">
                <FolderKanban size={24} aria-hidden="true" />
                Quản lý danh mục
            </h2>

            <CategoryOverlay
                open={showAddOverlay}
                onClose={() => setShowAddOverlay(false)}
                onSubmit={handleCreate}
            />

            <CategoryOverlay
                open={showEditOverlay}
                onClose={() => {
                    setShowEditOverlay(false);
                    setEditingCategory(null);
                }}
                onSubmit={handleSubmitEdit}
                mode="edit"
                initialValues={
                    editingCategory
                        ? {
                            categoryName: editingCategory.categoryName,
                            description: editingCategory.description ?? "",
                        }
                        : undefined
                }
            />

            {showDeleteOverlay && deletedCategory && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-card shadow-xl w-[440px] p-6">
                        <h2 className="text-2xl font-semibold text-danger mb-3">
                            Xóa danh mục
                        </h2>
                        <p className="text-slate-700 leading-relaxed mb-6">
                            Bạn sắp xóa danh mục{" "}
                            <span className="font-semibold text-danger">
                                {deletedCategory.categoryName}
                            </span>
                            .
                            <br />
                            <span className="text-sm text-slate-500">
                                Hành động này sẽ <b>không thể hoàn tác</b>. Bạn có chắc chắn muốn tiếp tục?
                            </span>
                        </p>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowDeleteOverlay(false)}
                                className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="cursor-pointer px-5 py-2.5 rounded-lg bg-danger text-white hover:bg-red-700 transition-colors duration-200"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-start mb-4">
                <button
                    type="button"
                    onClick={() => setShowAddOverlay(true)}
                    className="cursor-pointer group flex items-center gap-2 px-3 py-2 rounded-xl bg-cta
                                text-white text-sm font-semibold shadow-sm hover:bg-cta-dark hover:shadow-md
                                transition-all duration-200"
                >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-200">
                        <Plus size={16} aria-hidden="true" />
                    </span>
                    Thêm danh mục
                </button>
            </div>

            <div className="bg-white rounded-card shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-sm">
                        <colgroup>
                            <col className="w-16" />
                            <col className="w-56" />
                            <col className="w-auto" />
                            <col className="w-40" />
                            <col className="w-28" />
                        </colgroup>

                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-center text-slate-600">
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Tên danh mục</th>
                                <th className="px-4 py-3 font-medium">Mô tả</th>
                                <th className="px-4 py-3 font-medium">Số khóa học</th>
                                <th className="px-4 py-3 font-medium">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <SkeletonTable rows={5} columns={5} />
                            ) : (
                                categories.map((category) => (
                                    <tr
                                        key={category.categoryId}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                                    >
                                        <td className="text-center px-4 py-3">{category.categoryId}</td>
                                        <td className="text-center px-4 py-3 font-medium text-ink truncate">
                                            {category.categoryName}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 truncate">
                                            {category.description || "—"}
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                                {courseCountByCategory[category.categoryId] ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(category)}
                                                    className="cursor-pointer p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors duration-200"
                                                    title="Sửa danh mục"
                                                    aria-label="Sửa danh mục"
                                                >
                                                    <Pencil size={16} aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeletedCategory(category);
                                                        setShowDeleteOverlay(true);
                                                    }}
                                                    className="cursor-pointer p-2 rounded-lg text-danger hover:bg-danger-light transition-colors duration-200"
                                                    title="Xóa danh mục"
                                                    aria-label="Xóa danh mục"
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

                    {!loading && categories.length === 0 && (
                        <div className="p-8">
                            <EmptyState
                                icon={FolderX}
                                title="Chưa có danh mục nào"
                                description="Thêm danh mục đầu tiên để phân loại khóa học."
                            />
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default AdminCategories;
