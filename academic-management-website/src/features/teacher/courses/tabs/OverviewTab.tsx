import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useCategoriesQuery } from "@/shared/api/queries/useCategoriesQuery";
import type { TeacherCourse } from "@/shared/api/queries/useTeacherCoursesQuery";
import { useToast } from "@/shared/ui/useToast";
import Card from "@/shared/ui/Card";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";
import Button from "@/shared/ui/Button";

type OverviewForm = {
    title: string;
    description: string;
    categoryId: number | undefined;
    thumbnail: string;
    price: string;
    level: "beginner" | "intermediate" | "advanced";
};

const emptyForm: OverviewForm = {
    title: "",
    description: "",
    categoryId: undefined,
    thumbnail: "",
    price: "",
    level: "beginner",
};

const fromCourse = (course: TeacherCourse): OverviewForm => ({
    title: course.title,
    description: course.description ?? "",
    categoryId: course.category?.categoryId,
    thumbnail: course.thumbnail ?? "",
    price: String(course.price),
    level: (course.level as OverviewForm["level"]) ?? "beginner",
});

interface OverviewTabProps {
    course?: TeacherCourse;
    courseId?: number;
    onSaved: (course: TeacherCourse) => void;
}

const OverviewTab = ({ course, courseId, onSaved }: OverviewTabProps) => {
    const { showToast } = useToast();
    const categoriesQuery = useCategoriesQuery();
    const [form, setForm] = useState<OverviewForm>(course ? fromCourse(course) : emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (course) setForm(fromCourse(course));
    }, [course]);

    const validate = (): boolean => {
        const nextErrors: Record<string, string> = {};
        if (!form.title.trim()) nextErrors.title = "Tên khóa học không được để trống";
        if (!form.categoryId) nextErrors.categoryId = "Vui lòng chọn danh mục";
        if (!form.price || Number(form.price) < 0) nextErrors.price = "Giá không hợp lệ";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                categoryId: form.categoryId,
                thumbnail: form.thumbnail,
                price: Number(form.price),
                level: form.level,
            };

            const res = courseId
                ? await apiClient(API_ENDPOINTS.TEACHER.COURSE_DETAIL(courseId), {
                      method: "PUT",
                      body: JSON.stringify(payload),
                  })
                : await apiClient(API_ENDPOINTS.TEACHER.COURSES, {
                      method: "POST",
                      body: JSON.stringify(payload),
                  });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                showToast({ tone: "danger", message: data?.message || "Lưu khóa học thất bại" });
                return;
            }

            showToast({ tone: "success", message: courseId ? "Đã lưu thay đổi" : "Đã tạo khóa học" });
            onSaved(data as TeacherCourse);
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setSaving(false);
        }
    };

    const categories = categoriesQuery.data ?? [];

    return (
        <Card variant="app">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <FormField label="Tên khóa học" required error={errors.title}>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="VD: Lập trình React từ cơ bản"
                        />
                    </FormField>
                </div>

                <div className="md:col-span-2">
                    <FormField label="Mô tả khóa học" helperText="Hiển thị ở trang chi tiết khóa học">
                        <Textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Mô tả ngắn gọn nội dung khóa học"
                        />
                    </FormField>
                </div>

                <FormField label="Danh mục" required error={errors.categoryId}>
                    <select
                        value={form.categoryId ?? ""}
                        onChange={(e) =>
                            setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                    >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                                {c.categoryName}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label="Trình độ">
                    <select
                        value={form.level}
                        onChange={(e) => setForm({ ...form, level: e.target.value as OverviewForm["level"] })}
                        className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </FormField>

                <FormField label="Giá khóa học (VNĐ)" required error={errors.price}>
                    <Input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="VD: 499000"
                    />
                </FormField>

                <FormField label="Thumbnail URL" helperText="Ảnh đại diện cho khóa học">
                    <Input
                        value={form.thumbnail}
                        onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                        placeholder="https://..."
                    />
                </FormField>
            </div>

            <div className="mt-6 flex justify-end">
                <Button variant="primary" loading={saving} onClick={handleSubmit}>
                    Lưu
                </Button>
            </div>
        </Card>
    );
};

export default OverviewTab;
