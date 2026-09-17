import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Ticket, TicketX, Pencil, Ban, Plus, AlertTriangle } from "lucide-react";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient, readErrorMessage } from "@/shared/api/client";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Modal from "@/shared/ui/Modal";
import Table, { type TableColumn } from "@/shared/ui/Table";
import { useToast } from "@/shared/ui/useToast";
import CouponFormOverlay, { type CouponPayload } from "@/features/admin/components/CouponFormOverlay";
import {
    useAdminCouponsQuery,
    adminCouponsQueryKey,
    type AdminCoupon,
} from "@/shared/api/queries/useAdminCouponsQuery";

const formatDiscount = (coupon: AdminCoupon) =>
    coupon.discountType === "PERCENTAGE"
        ? `${coupon.discountValue}%`
        : `${Number(coupon.discountValue).toLocaleString("vi-VN")}₫`;

const isExpired = (coupon: AdminCoupon) => coupon.expiresAt !== null && new Date(coupon.expiresAt) < new Date();

// courseId/expiresAt của CouponPayload là string (form input) — chuyển đổi 2 chiều với
// AdminCoupon (số/ISO) ở đây, không lẫn vào query hook (giữ hook chỉ đọc dữ liệu thô).
const toPayload = (coupon: AdminCoupon): CouponPayload => ({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    courseId: coupon.courseId,
    maxRedemptions: coupon.maxRedemptions !== null ? String(coupon.maxRedemptions) : "",
    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : "",
});

const toRequestBody = (form: CouponPayload) => ({
    code: form.code.trim(),
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    courseId: form.courseId,
    maxRedemptions: form.maxRedemptions.trim() ? Number(form.maxRedemptions) : null,
    expiresAt: form.expiresAt ? `${form.expiresAt}:00` : null,
});

const AdminCoupons = () => {
    const { t } = useTranslation("admin");
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const couponsQuery = useAdminCouponsQuery();
    const coupons = couponsQuery.data ?? [];

    const [showAddOverlay, setShowAddOverlay] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | undefined>(undefined);

    const [deactivatingCoupon, setDeactivatingCoupon] = useState<AdminCoupon | null>(null);
    const [deactivating, setDeactivating] = useState(false);

    // useMemo giữ nguyên identity giữa các lần AdminCoupons re-render (vd. khi setFormSubmitting
    // trong lúc submit) — nếu tạo object mới mỗi render, useEffect ở CouponFormOverlay (phụ thuộc
    // initialValues) sẽ fire lại và reset form về giá trị gốc, xóa mất phần admin đang chỉnh dở
    // (cùng pattern editingCategoryInitialValues ở AdminCategories.tsx).
    const editingCouponInitialValues = useMemo<CouponPayload | undefined>(
        () => (editingCoupon ? toPayload(editingCoupon) : undefined),
        [editingCoupon]
    );

    const handleCreate = async (form: CouponPayload) => {
        setFormSubmitting(true);
        setFormError(undefined);
        try {
            const res = await apiClient(API_ENDPOINTS.COUPONS.CREATE, {
                method: "POST",
                body: JSON.stringify(toRequestBody(form)),
            });

            if (!res.ok) {
                const message = await readErrorMessage(res, t("coupons.createFailed"));
                setFormError(message);
                return;
            }

            showToast({ tone: "success", message: t("coupons.created") });
            setShowAddOverlay(false);
            queryClient.invalidateQueries({ queryKey: adminCouponsQueryKey });
        } catch {
            setFormError(t("coupons.connectionError"));
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleSubmitEdit = async (form: CouponPayload) => {
        if (!editingCoupon) return;

        setFormSubmitting(true);
        setFormError(undefined);
        try {
            const res = await apiClient(API_ENDPOINTS.COUPONS.UPDATE(editingCoupon.id), {
                method: "PUT",
                body: JSON.stringify(toRequestBody(form)),
            });

            if (!res.ok) {
                const message = await readErrorMessage(res, t("coupons.updateFailed"));
                setFormError(message);
                return;
            }

            showToast({ tone: "success", message: t("coupons.updated") });
            setEditingCoupon(null);
            queryClient.invalidateQueries({ queryKey: adminCouponsQueryKey });
        } catch {
            setFormError(t("coupons.connectionError"));
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivatingCoupon) return;

        setDeactivating(true);
        try {
            const res = await apiClient(API_ENDPOINTS.COUPONS.DEACTIVATE(deactivatingCoupon.id), {
                method: "POST",
            });

            if (!res.ok) {
                const message = await readErrorMessage(res, t("coupons.deactivateFailed"));
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: t("coupons.deactivated", { code: deactivatingCoupon.code }) });
            setDeactivatingCoupon(null);
            queryClient.invalidateQueries({ queryKey: adminCouponsQueryKey });
        } catch {
            showToast({ tone: "danger", message: t("coupons.connectionError") });
        } finally {
            setDeactivating(false);
        }
    };

    const columns: TableColumn<AdminCoupon>[] = [
        {
            key: "code",
            header: t("coupons.columnCode"),
            render: (coupon) => <span className="font-medium text-primary">{coupon.code}</span>,
        },
        {
            key: "discount",
            header: t("coupons.columnDiscountType"),
            render: (coupon) => formatDiscount(coupon),
        },
        {
            key: "scope",
            header: t("coupons.columnScope"),
            render: (coupon) => coupon.courseTitle ?? t("coupons.scopePlatformWide"),
        },
        {
            key: "expiresAt",
            header: t("coupons.columnExpiresAt"),
            render: (coupon) => (coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("vi-VN") : t("coupons.unlimited")),
        },
        {
            key: "redemptionCount",
            header: t("coupons.columnRedemptionCount"),
            render: (coupon) => `${coupon.redemptionCount}${coupon.maxRedemptions !== null ? ` / ${coupon.maxRedemptions}` : ""}`,
        },
        {
            key: "status",
            header: t("coupons.columnStatus"),
            render: (coupon) =>
                coupon.active && !isExpired(coupon) ? (
                    <Badge variant="status" tone="success">
                        {t("coupons.statusActive")}
                    </Badge>
                ) : (
                    <Badge variant="status" tone="danger">
                        {isExpired(coupon) ? t("coupons.statusExpired") : t("coupons.statusDeactivated")}
                    </Badge>
                ),
        },
        {
            key: "actions",
            header: t("coupons.columnActions"),
            render: (coupon) => (
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setEditingCoupon(coupon)}
                        className="cursor-pointer p-2 rounded-radius-md text-secondary hover:bg-surface-muted transition-colors"
                        title={t("coupons.edit")}
                        aria-label={t("coupons.editAria", { code: coupon.code })}
                    >
                        <Pencil size={16} aria-hidden="true" />
                    </button>
                    {coupon.active && (
                        <button
                            type="button"
                            onClick={() => setDeactivatingCoupon(coupon)}
                            className="cursor-pointer p-2 rounded-radius-md text-status-danger-text hover:bg-status-danger-bg transition-colors"
                            title={t("coupons.deactivate")}
                            aria-label={t("coupons.deactivateAria", { code: coupon.code })}
                        >
                            <Ban size={16} aria-hidden="true" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="flex items-center gap-3 text-h2 text-primary">
                        <Ticket size={24} aria-hidden="true" />
                        {t("coupons.title")}
                    </h2>
                </div>
                <Button variant="primary" iconLeft={Plus} onClick={() => setShowAddOverlay(true)}>
                    {t("coupons.createCoupon")}
                </Button>
            </div>

            {couponsQuery.isError ? (
                <EmptyState
                    icon={AlertTriangle}
                    title={t("coupons.loadErrorTitle")}
                    description={t("coupons.loadErrorDescription")}
                    action={
                        <Button variant="primary" size="sm" onClick={() => couponsQuery.refetch()}>
                            {t("coupons.retry")}
                        </Button>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    data={coupons}
                    rowKey={(coupon) => coupon.id}
                    loading={couponsQuery.isLoading}
                    emptyState={
                        <EmptyState
                            icon={TicketX}
                            title={t("coupons.emptyTitle")}
                            action={
                                <Button variant="primary" iconLeft={Plus} onClick={() => setShowAddOverlay(true)}>
                                    {t("coupons.createCoupon")}
                                </Button>
                            }
                        />
                    }
                />
            )}

            <CouponFormOverlay
                open={showAddOverlay}
                onClose={() => {
                    setShowAddOverlay(false);
                    setFormError(undefined);
                }}
                onSubmit={handleCreate}
                submitting={formSubmitting}
                errorMessage={formError}
            />

            <CouponFormOverlay
                open={editingCoupon !== null}
                onClose={() => {
                    setEditingCoupon(null);
                    setFormError(undefined);
                }}
                onSubmit={handleSubmitEdit}
                mode="edit"
                submitting={formSubmitting}
                errorMessage={formError}
                initialValues={editingCouponInitialValues}
            />

            <Modal
                open={deactivatingCoupon !== null}
                onClose={() => {
                    if (deactivating) return;
                    setDeactivatingCoupon(null);
                }}
                closeDisabled={deactivating}
                title={t("coupons.deactivateModalTitle")}
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeactivatingCoupon(null)} disabled={deactivating}>
                            {t("coupons.cancel")}
                        </Button>
                        <Button variant="danger" onClick={handleDeactivate} loading={deactivating}>
                            {t("coupons.deactivate")}
                        </Button>
                    </>
                }
            >
                <p className="text-body text-secondary">
                    {t("coupons.deactivateConfirmPrefix")} <span className="font-semibold text-primary">{deactivatingCoupon?.code}</span>
                    {t("coupons.deactivateConfirmSuffix")}
                </p>
            </Modal>
        </div>
    );
};

export default AdminCoupons;
