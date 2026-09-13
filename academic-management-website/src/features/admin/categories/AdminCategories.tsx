import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Pencil, Trash2, Plus, FolderX } from "lucide-react";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient, readErrorMessage } from "@/shared/api/client";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn } from "@/shared/ui/Table";
import ConfirmDeleteModal from "@/shared/ui/ConfirmDeleteModal";
import { useToast } from "@/shared/ui/useToast";
import CategoryFormOverlay, { type CategoryPayload } from "@/features/admin/components/CategoryFormOverlay";
import { useAdminCategoriesQuery, adminCategoriesQueryKey, type AdminCategory as Category } from "@/shared/api/queries/useAdminCategoriesQuery";
import { useAdminCoursesQuery } from "@/shared/api/queries/useAdminCoursesQuery";

const AdminCategories = () => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const categoriesQuery = useAdminCategoriesQuery();
    const categories = categoriesQuery.data ?? [];

    const coursesQuery = useAdminCoursesQuery();
    const courseCountByCategory = useMemo<Record<number, number>>(() => {
        const counts: Record<number, number> = {};
        (coursesQuery.data ?? []).forEach((course) => {
            const id = course.categoryId;
            if (id != null) {
                counts[id] = (counts[id] ?? 0) + 1;
            }
        });
        return counts;
    }, [coursesQuery.data]);

    const [showAddOverlay, setShowAddOverlay] = useState(false);
    const [showEditOverlay, setShowEditOverlay] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const editingCategoryInitialValues = useMemo<CategoryPayload | undefined>(
        () =>
            editingCategory
                ? { categoryName: editingCategory.categoryName, description: editingCategory.description ?? "" }
                : undefined,
        [editingCategory]
    );

    const [deletedCategory, setDeletedCategory] = useState<Category | null>(null);
    const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
    const [deleting, setDeleting] = useState(false);

    const handleCreate = async (form: CategoryPayload) => {
        setFormSubmitting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.CATEGORIES.ADD, {
                method: "POST",
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const message = await readErrorMessage(res, "Thêm danh mục thất bại");
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: "Đã thêm danh mục mới" });
            setShowAddOverlay(false);
            queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setShowEditOverlay(true);
    };

    const handleSubmitEdit = async (form: CategoryPayload) => {
        if (!editingCategory) return;

        setFormSubmitting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.CATEGORIES.DETAIL(editingCategory.categoryId), {
                method: "PUT",
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const message = await readErrorMessage(res, "Cập nhật danh mục thất bại");
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: "Đã cập nhật danh mục" });
            setShowEditOverlay(false);
            setEditingCategory(null);
            queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletedCategory) return;

        setDeleting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.CATEGORIES.DETAIL(deletedCategory.categoryId), {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const message = data?.message || "Xóa danh mục thất bại";
                setDeleteError(message);
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: "Đã xóa danh mục" });
            setDeletedCategory(null);
            setDeleteError(undefined);
            queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
        } catch {
            setDeleteError("Lỗi kết nối server");
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setDeleting(false);
        }
    };

    const columns: TableColumn<Category>[] = [
        {
            key: "categoryName",
            header: "Tên danh mục",
            render: (category) => <span className="font-medium text-primary">{category.categoryName}</span>,
        },
        {
            key: "courseCount",
            header: "Số khóa học",
            render: (category) => (
                <Badge variant="status" tone="info">
                    {courseCountByCategory[category.categoryId] ?? 0}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: "Action",
            render: (category) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(category);
                        }}
                        className="cursor-pointer p-2 rounded-radius-md text-secondary hover:bg-surface-muted transition-colors"
                        title="Sửa danh mục"
                        aria-label={`Sửa danh mục ${category.categoryName}`}
                    >
                        <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeletedCategory(category);
                            setDeleteError(undefined);
                        }}
                        className="cursor-pointer p-2 rounded-radius-md text-status-danger-text hover:bg-status-danger-bg transition-colors"
                        title="Xóa danh mục"
                        aria-label={`Xóa danh mục ${category.categoryName}`}
                    >
                        <Trash2 size={16} aria-hidden="true" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="flex items-center gap-3 text-h2 text-primary">
                        <FolderKanban size={24} aria-hidden="true" />
                        Quản lý danh mục
                    </h2>
                </div>
                <Button variant="primary" iconLeft={Plus} onClick={() => setShowAddOverlay(true)}>
                    Thêm danh mục
                </Button>
            </div>

            <Table
                columns={columns}
                data={categories}
                rowKey={(category) => category.categoryId}
                loading={categoriesQuery.isLoading}
                emptyState={
                    <EmptyState
                        icon={FolderX}
                        title="Chưa có danh mục nào"
                        description="Thêm danh mục đầu tiên để phân loại khóa học."
                        action={
                            <Button variant="primary" iconLeft={Plus} onClick={() => setShowAddOverlay(true)}>
                                Thêm danh mục
                            </Button>
                        }
                    />
                }
            />

            <CategoryFormOverlay
                open={showAddOverlay}
                onClose={() => setShowAddOverlay(false)}
                onSubmit={handleCreate}
                submitting={formSubmitting}
            />

            <CategoryFormOverlay
                open={showEditOverlay}
                onClose={() => {
                    setShowEditOverlay(false);
                    setEditingCategory(null);
                }}
                onSubmit={handleSubmitEdit}
                mode="edit"
                submitting={formSubmitting}
                initialValues={editingCategoryInitialValues}
            />

            <ConfirmDeleteModal
                open={deletedCategory !== null}
                onClose={() => {
                    if (deleting) return;
                    setDeletedCategory(null);
                    setDeleteError(undefined);
                }}
                onConfirm={handleDelete}
                itemName={deletedCategory?.categoryName ?? ""}
                loading={deleting}
                error={deleteError}
            />
        </div>
    );
};

export default AdminCategories;
