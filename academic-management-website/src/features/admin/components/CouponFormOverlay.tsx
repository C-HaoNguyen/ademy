import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import { useAdminCoursesQuery } from "@/shared/api/queries/useAdminCoursesQuery";
import type { CouponDiscountType } from "@/shared/api/queries/useAdminCouponsQuery";

export interface CouponPayload {
    code: string;
    discountType: CouponDiscountType;
    discountValue: string;
    courseId: number | null;
    maxRedemptions: string;
    expiresAt: string;
}

interface CouponFormOverlayProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CouponPayload) => void;
    initialValues?: CouponPayload | null;
    mode?: "add" | "edit";
    submitting?: boolean;
    errorMessage?: string;
}

const emptyForm: CouponPayload = {
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    courseId: null,
    maxRedemptions: "",
    expiresAt: "",
};

type FieldErrors = Partial<Record<"code" | "discountValue" | "courseId" | "maxRedemptions", string>>;

// UI_SPEC §5.6 — Modal form: mã, loại giảm, phạm vi (toàn nền tảng/khóa học cụ thể), hạn dùng,
// giới hạn lượt dùng. courseId=null == phạm vi toàn nền tảng (CouponRequest.courseId ở backend).
const CouponFormOverlay = ({
    open,
    onClose,
    onSubmit,
    initialValues,
    mode = "add",
    submitting = false,
    errorMessage,
}: CouponFormOverlayProps) => {
    const { t } = useTranslation("admin");
    const [form, setForm] = useState<CouponPayload>(initialValues ?? emptyForm);
    const [errors, setErrors] = useState<FieldErrors>({});
    // Tách khỏi form.courseId — courseId chỉ được ghi khi admin THỰC SỰ chọn 1 khóa học ở dropdown
    // thứ 2, không phải suy ra tự động (tránh bug: courses[0] auto-pick âm thầm revert về
    // "Toàn nền tảng" khi danh sách khóa học rỗng/chưa load xong).
    const [scope, setScope] = useState<"PLATFORM" | "COURSE">(
        (initialValues ?? emptyForm).courseId !== null ? "COURSE" : "PLATFORM"
    );

    const coursesQuery = useAdminCoursesQuery();
    const courses = coursesQuery.data ?? [];

    useEffect(() => {
        if (!open) return;
        const nextForm = initialValues ?? emptyForm;
        setForm(nextForm);
        setScope(nextForm.courseId !== null ? "COURSE" : "PLATFORM");
        setErrors({});
    }, [open, initialValues]);

    const isEdit = mode === "edit";
    const isCourseScoped = scope === "COURSE";

    const handleSubmit = () => {
        const nextErrors: FieldErrors = {};
        if (!form.code.trim()) nextErrors.code = t("couponFormOverlay.codeRequired");
        if (!form.discountValue.trim() || Number(form.discountValue) <= 0) {
            nextErrors.discountValue = t("couponFormOverlay.discountValueInvalid");
        }
        if (isCourseScoped && form.courseId === null) {
            nextErrors.courseId = t("couponFormOverlay.courseRequired");
        }
        if (form.maxRedemptions.trim() && Number(form.maxRedemptions) <= 0) {
            nextErrors.maxRedemptions = t("couponFormOverlay.maxRedemptionsInvalid");
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit(form);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeDisabled={submitting}
            title={isEdit ? t("couponFormOverlay.editTitle") : t("couponFormOverlay.createTitle")}
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("couponFormOverlay.cancel")}
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                        {isEdit ? t("couponFormOverlay.saveChanges") : t("couponFormOverlay.createTitle")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <FormField label={t("couponFormOverlay.codeLabel")} required error={errors.code}>
                    <Input
                        value={form.code}
                        onChange={(e) => {
                            setForm({ ...form, code: e.target.value });
                            if (errors.code) setErrors({ ...errors, code: undefined });
                        }}
                        placeholder={t("couponFormOverlay.codePlaceholder")}
                    />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label={t("couponFormOverlay.discountTypeLabel")} required>
                        <select
                            value={form.discountType}
                            onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponDiscountType })}
                            className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                        >
                            <option value="PERCENTAGE">{t("couponFormOverlay.discountTypePercentage")}</option>
                            <option value="FIXED">{t("couponFormOverlay.discountTypeFixed")}</option>
                        </select>
                    </FormField>
                    <FormField label={t("couponFormOverlay.discountValueLabel")} required error={errors.discountValue}>
                        <Input
                            type="number"
                            min="0"
                            value={form.discountValue}
                            onChange={(e) => {
                                setForm({ ...form, discountValue: e.target.value });
                                if (errors.discountValue) setErrors({ ...errors, discountValue: undefined });
                            }}
                            placeholder={form.discountType === "PERCENTAGE" ? t("couponFormOverlay.discountValuePlaceholderPercentage") : t("couponFormOverlay.discountValuePlaceholderFixed")}
                        />
                    </FormField>
                </div>

                <FormField label={t("couponFormOverlay.scopeLabel")} required>
                    <select
                        value={scope}
                        onChange={(e) => {
                            const nextScope = e.target.value as "PLATFORM" | "COURSE";
                            setScope(nextScope);
                            if (nextScope === "PLATFORM") {
                                setForm({ ...form, courseId: null });
                            }
                            if (errors.courseId) setErrors({ ...errors, courseId: undefined });
                        }}
                        className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                    >
                        <option value="PLATFORM">{t("couponFormOverlay.scopePlatform")}</option>
                        <option value="COURSE">{t("couponFormOverlay.scopeCourse")}</option>
                    </select>
                </FormField>

                {isCourseScoped && (
                    <FormField label={t("couponFormOverlay.courseLabel")} required error={errors.courseId}>
                        <select
                            value={form.courseId ?? ""}
                            onChange={(e) => {
                                setForm({ ...form, courseId: e.target.value ? Number(e.target.value) : null });
                                if (errors.courseId) setErrors({ ...errors, courseId: undefined });
                            }}
                            className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                        >
                            <option value="">{t("couponFormOverlay.coursePlaceholder")}</option>
                            {courses.map((c) => (
                                <option key={c.courseId} value={c.courseId}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                    </FormField>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        label={t("couponFormOverlay.maxRedemptionsLabel")}
                        error={errors.maxRedemptions}
                        helperText={errors.maxRedemptions ? undefined : t("couponFormOverlay.maxRedemptionsHelper")}
                    >
                        <Input
                            type="number"
                            min="1"
                            value={form.maxRedemptions}
                            onChange={(e) => {
                                setForm({ ...form, maxRedemptions: e.target.value });
                                if (errors.maxRedemptions) setErrors({ ...errors, maxRedemptions: undefined });
                            }}
                            placeholder={t("couponFormOverlay.maxRedemptionsPlaceholder")}
                        />
                    </FormField>
                    <FormField label={t("couponFormOverlay.expiresAtLabel")} helperText={t("couponFormOverlay.expiresAtHelper")}>
                        <Input
                            type="datetime-local"
                            value={form.expiresAt}
                            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        />
                    </FormField>
                </div>

                {errorMessage && <p className="text-body-sm text-status-danger-text">{errorMessage}</p>}
            </div>
        </Modal>
    );
};

export default CouponFormOverlay;
