import { useEffect, useState } from "react";
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
        if (!form.code.trim()) nextErrors.code = "Vui lòng nhập mã coupon";
        if (!form.discountValue.trim() || Number(form.discountValue) <= 0) {
            nextErrors.discountValue = "Giá trị giảm phải lớn hơn 0";
        }
        if (isCourseScoped && form.courseId === null) {
            nextErrors.courseId = "Vui lòng chọn khóa học";
        }
        if (form.maxRedemptions.trim() && Number(form.maxRedemptions) <= 0) {
            nextErrors.maxRedemptions = "Giới hạn lượt dùng phải lớn hơn 0";
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
            title={isEdit ? "Sửa coupon" : "Tạo coupon"}
            size="md"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                        {isEdit ? "Lưu thay đổi" : "Tạo coupon"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <FormField label="Mã coupon" required error={errors.code}>
                    <Input
                        value={form.code}
                        onChange={(e) => {
                            setForm({ ...form, code: e.target.value });
                            if (errors.code) setErrors({ ...errors, code: undefined });
                        }}
                        placeholder="VD: SUMMER2026"
                    />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Loại giảm" required>
                        <select
                            value={form.discountType}
                            onChange={(e) => setForm({ ...form, discountType: e.target.value as CouponDiscountType })}
                            className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                        >
                            <option value="PERCENTAGE">Phần trăm (%)</option>
                            <option value="FIXED">Số tiền cố định</option>
                        </select>
                    </FormField>
                    <FormField label="Giá trị giảm" required error={errors.discountValue}>
                        <Input
                            type="number"
                            min="0"
                            value={form.discountValue}
                            onChange={(e) => {
                                setForm({ ...form, discountValue: e.target.value });
                                if (errors.discountValue) setErrors({ ...errors, discountValue: undefined });
                            }}
                            placeholder={form.discountType === "PERCENTAGE" ? "VD: 10" : "VD: 50000"}
                        />
                    </FormField>
                </div>

                <FormField label="Phạm vi" required>
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
                        <option value="PLATFORM">Toàn nền tảng</option>
                        <option value="COURSE">Khóa học cụ thể</option>
                    </select>
                </FormField>

                {isCourseScoped && (
                    <FormField label="Khóa học" required error={errors.courseId}>
                        <select
                            value={form.courseId ?? ""}
                            onChange={(e) => {
                                setForm({ ...form, courseId: e.target.value ? Number(e.target.value) : null });
                                if (errors.courseId) setErrors({ ...errors, courseId: undefined });
                            }}
                            className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                        >
                            <option value="">-- Chọn khóa học --</option>
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
                        label="Giới hạn lượt dùng"
                        error={errors.maxRedemptions}
                        helperText={errors.maxRedemptions ? undefined : "Để trống nếu không giới hạn"}
                    >
                        <Input
                            type="number"
                            min="1"
                            value={form.maxRedemptions}
                            onChange={(e) => {
                                setForm({ ...form, maxRedemptions: e.target.value });
                                if (errors.maxRedemptions) setErrors({ ...errors, maxRedemptions: undefined });
                            }}
                            placeholder="Không giới hạn"
                        />
                    </FormField>
                    <FormField label="Hạn dùng" helperText="Để trống nếu không có hạn">
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
