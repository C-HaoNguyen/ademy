import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface CategoryPayload {
    categoryName: string;
    description: string;
}

interface CategoryOverlayProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CategoryPayload) => void;
    initialValues?: CategoryPayload | null;
    mode?: "add" | "edit";
}

const emptyForm: CategoryPayload = { categoryName: "", description: "" };

const CategoryOverlay = ({
    open,
    onClose,
    onSubmit,
    initialValues,
    mode = "add",
}: CategoryOverlayProps) => {
    const [form, setForm] = useState<CategoryPayload>(initialValues ?? emptyForm);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setForm(initialValues ?? emptyForm);
        setError(null);
    }, [open, initialValues]);

    const isEdit = mode === "edit";

    const handleSubmit = () => {
        if (!form.categoryName.trim()) {
            setError("Tên danh mục không được để trống");
            return;
        }
        setError(null);
        onSubmit(form);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-white rounded-card shadow-xl w-[460px] p-6"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-semibold text-primary mb-1">
                            {isEdit ? "Sửa danh mục" : "Thêm danh mục"}
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">
                            {isEdit
                                ? "Cập nhật thông tin danh mục khóa học"
                                : "Tạo danh mục mới để phân loại khóa học"}
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">
                                    Tên danh mục <span className="text-danger">*</span>
                                </label>
                                <input
                                    value={form.categoryName}
                                    onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2
                                               focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors duration-200"
                                    placeholder="VD: Lập trình Web"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">
                                    Mô tả
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 resize-none
                                               focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors duration-200"
                                    placeholder="Mô tả ngắn gọn về danh mục"
                                />
                            </div>

                            {error && <p className="text-sm text-danger">{error}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-5 mt-6 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="cursor-pointer px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors duration-200"
                            >
                                {isEdit ? "Lưu thay đổi" : "Thêm danh mục"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CategoryOverlay;
