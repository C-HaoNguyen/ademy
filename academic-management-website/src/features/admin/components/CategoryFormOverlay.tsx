import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("admin");
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
            setError(t("categoryFormOverlay.nameRequired"));
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
            title={isEdit ? t("categoryFormOverlay.editTitle") : t("categoryFormOverlay.addTitle")}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t("categoryFormOverlay.cancel")}
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                        {isEdit ? t("categoryFormOverlay.saveChanges") : t("categoryFormOverlay.addTitle")}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <FormField label={t("categoryFormOverlay.nameLabel")} required error={error}>
                    <Input
                        value={form.categoryName}
                        onChange={(e) => {
                            setForm({ ...form, categoryName: e.target.value });
                            if (error) setError(undefined);
                        }}
                        placeholder={t("categoryFormOverlay.namePlaceholder")}
                    />
                </FormField>
                <FormField label={t("categoryFormOverlay.descriptionLabel")}>
                    <Textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder={t("categoryFormOverlay.descriptionPlaceholder")}
                    />
                </FormField>
            </div>
        </Modal>
    );
};

export default CategoryFormOverlay;
