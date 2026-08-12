import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Field = ({
    label,
    required,
    children,
    hint,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
        </label>
        {children}
        {hint && (
            <p className="text-xs text-slate-500">{hint}</p>
        )}
    </div>
);

const inputClass = "w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors duration-200";

interface AddCourseOverlayProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCoursePayload) => void;
    instructors: { userId: number; fullName: string }[];
    categories: { categoryId: number; categoryName: string }[];
    initialValues?: CreateCoursePayload | null;
    mode?: "add" | "edit";
}

export interface CreateCoursePayload {
    title: string;
    description?: string;
    instructorId: number;
    categoryId?: number;
    price: number;
    thumbnail?: string;
    level: "beginner" | "intermediate" | "advanced";
    status: "draft" | "published" | "archived";
}

const emptyForm = (instructors: { userId: number; fullName: string }[]): CreateCoursePayload => ({
    title: "",
    description: "",
    instructorId: instructors[0]?.userId ?? 0,
    categoryId: undefined,
    price: 0,
    thumbnail: "",
    level: "beginner",
    status: "draft",
});

const AddCourseOverlay = ({
    open,
    onClose,
    onSubmit,
    instructors,
    categories,
    initialValues,
    mode = "add",
}: AddCourseOverlayProps) => {
    const [form, setForm] = useState<CreateCoursePayload>(
        initialValues ?? emptyForm(instructors)
    );

    useEffect(() => {
        if (!open) return;
        setForm(initialValues ?? emptyForm(instructors));
    }, [open, initialValues, instructors]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]:
                name === "price" || name === "instructorId" || name === "categoryId"
                    ? Number(value)
                    : value,
        }));
    };

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!form.instructorId) {
            setError("Chưa có giảng viên");
            return;
        }
        setError(null);
        onSubmit(form);
    };

    const isEdit = mode === "edit";

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-card shadow-xl w-[520px] max-h-[90vh] flex flex-col"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        {/* Header */}
                        <div className="px-6 pt-6">
                            <h2 className="text-2xl font-semibold text-primary mb-1">
                                {isEdit ? "Sửa khóa học" : "Thêm khóa học"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {isEdit
                                    ? "Cập nhật thông tin khóa học"
                                    : "Nhập thông tin cơ bản để tạo khóa học mới"}
                            </p>
                        </div>

                        {/* Form */}
                        <div className="px-6 py-4 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                <Field label="Tên khóa học" required>
                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="VD: Lập trình React từ cơ bản"
                                    />
                                </Field>

                                <Field label="Mô tả khóa học" hint="Hiển thị ở trang chi tiết khóa học">
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        className={`${inputClass} resize-none`}
                                        rows={3}
                                        placeholder="Mô tả ngắn gọn nội dung khóa học"
                                    />
                                </Field>

                                <Field label="Giảng viên phụ trách" required>
                                    <select
                                        name="instructorId"
                                        value={form.instructorId}
                                        onChange={handleChange}
                                        disabled={instructors.length === 0}
                                        className={inputClass}
                                    >
                                        {instructors.map((i) => (
                                            <option key={i.userId} value={i.userId}>
                                                {i.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Danh mục">
                                    <select
                                        name="categoryId"
                                        value={form.categoryId}
                                        onChange={handleChange}
                                        className={inputClass}
                                    >
                                        <option value="">-- Chưa phân loại --</option>
                                        {categories.map((c) => (
                                            <option key={c.categoryId} value={c.categoryId}>
                                                {c.categoryName}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Giá khóa học (VNĐ)">
                                    <input
                                        name="price"
                                        type="number"
                                        value={form.price}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="VD: 499000"
                                    />
                                </Field>

                                <Field label="Thumbnail URL" hint="Ảnh đại diện cho khóa học">
                                    <input
                                        name="thumbnail"
                                        value={form.thumbnail}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="https://..."
                                    />
                                </Field>

                                <div className="flex gap-4">
                                    <Field label="Trình độ">
                                        <select
                                            name="level"
                                            value={form.level}
                                            onChange={handleChange}
                                            className={inputClass}
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </Field>

                                    <Field label="Trạng thái">
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleChange}
                                            className={inputClass}
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </Field>
                                </div>

                                {error && <p className="text-sm text-danger">{error}</p>}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer px-5 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="cursor-pointer px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors duration-200"
                            >
                                {isEdit ? "Lưu thay đổi" : "Thêm"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddCourseOverlay;
