import { useEffect, useState } from "react";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";

export interface CategoryPayload {
    categoryName: string;
    description: string;
}

interface CategoryFormOverlayProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CategoryPayload) => void;
    initialValues?: CategoryPayload | null;
    mode?: "add" | "edit";
    submitting?: boolean;
}

const emptyForm: CategoryPayload = { categoryName: "", description: "" };

const CategoryFormOverlay = ({
    open,
    onClose,
    onSubmit,
    initialValues,
    mode = "add",
    submitting = false,
}: CategoryFormOverlayProps) => {
    const [form, setForm] = useState<CategoryPayload>(initialValues ?? emptyForm);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!open) return;
        setForm(initialValues ?? emptyForm);
        setError(undefined);
    }, [open, initialValues]);

    const isEdit = mode === "edit";

    const handleSubmit = () => {
        if (!form.categoryName.trim()) {
            setError("Tên danh mục không được để trống");
            return;
        }
        setError(undefined);
        onSubmit(form);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeDisabled={submitting}
            title={isEdit ? "Sửa danh mục" : "Thêm danh mục"}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                        {isEdit ? "Lưu thay đổi" : "Thêm danh mục"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <FormField label="Tên danh mục" required error={error}>
                    <Input
                        value={form.categoryName}
                        onChange={(e) => {
                            setForm({ ...form, categoryName: e.target.value });
                            if (error) setError(undefined);
                        }}
                        placeholder="VD: Lập trình Web"
                    />
                </FormField>
                <FormField label="Mô tả">
                    <Textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Mô tả ngắn gọn về danh mục"
                    />
                </FormField>
            </div>
        </Modal>
    );
};

export default CategoryFormOverlay;
