import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("admin");
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
                const message = await readErrorMessage(res, t("categories.createFailed"));
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: t("categories.created") });
            setShowAddOverlay(false);
            queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
        } catch {
            showToast({ tone: "danger", message: t("categories.connectionError") });
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
                const message = await readErrorMessage(res, t("categories.updateFailed"));
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: t("categories.updated") });
            setShowEditOverlay(false);
            setEditingCategory(null);
            queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
        } catch {
            showToast({ tone: "danger", message: t("categories.connectionError") });
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
                const message = data?.message || t("categories.deleteFailed");
                setDeleteError(message);
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: t("categories.deleted") });
            setDeletedCategory(null);
            setDeleteError(undefined);
            queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
        } catch {
            setDeleteError(t("categories.connectionError"));
            showToast({ tone: "danger", message: t("categories.connectionError") });
        } finally {
            setDeleting(false);
        }
    };

    const columns: TableColumn<Category>[] = [
        {
            key: "categoryName",
            header: t("categories.columnName"),
            render: (category) => <span className="font-medium text-primary">{category.categoryName}</span>,
        },
        {
            key: "courseCount",
            header: t("categories.columnCourseCount"),
            render: (category) => (
                <Badge variant="status" tone="info">
                    {courseCountByCategory[category.categoryId] ?? 0}
                </Badge>
            ),
        },
        {
            key: "actions",
            header: t("categories.columnActions"),
            render: (category) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(category);
                        }}
                        className="cursor-pointer p-2 rounded-radius-md text-secondary hover:bg-surface-muted transition-colors"
                        title={t("categories.edit")}
                        aria-label={t("categories.editAria", { name: category.categoryName })}
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
                        title={t("categories.delete")}
                        aria-label={t("categories.deleteAria", { name: category.categoryName })}
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
                        {t("categories.title")}
                    </h2>
                </div>
                <Button variant="primary" iconLeft={Plus} onClick={() => setShowAddOverlay(true)}>
                    {t("categories.addCategory")}
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
                        title={t("categories.emptyTitle")}
                        description={t("categories.emptyDescription")}
                        action={
                            <Button variant="primary" iconLeft={Plus} onClick={() => setShowAddOverlay(true)}>
                                {t("categories.addCategory")}
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
