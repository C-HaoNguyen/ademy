import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation("teacher");
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
        if (!form.title.trim()) nextErrors.title = t("overviewTab.titleRequired");
        if (!form.categoryId) nextErrors.categoryId = t("overviewTab.categoryRequired");
        if (!form.price || Number(form.price) < 0) nextErrors.price = t("overviewTab.priceInvalid");
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
                showToast({ tone: "danger", message: data?.message || t("overviewTab.saveFailed") });
                return;
            }

            showToast({ tone: "success", message: courseId ? t("overviewTab.savedChanges") : t("overviewTab.courseCreated") });
            onSaved(data as TeacherCourse);
        } catch {
            showToast({ tone: "danger", message: t("overviewTab.connectionError") });
        } finally {
            setSaving(false);
        }
    };

    const categories = categoriesQuery.data ?? [];

    return (
        <Card variant="app">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <FormField label={t("overviewTab.courseTitleLabel")} required error={errors.title}>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder={t("overviewTab.courseTitlePlaceholder")}
                        />
                    </FormField>
                </div>

                <div className="md:col-span-2">
                    <FormField label={t("overviewTab.descriptionLabel")} helperText={t("overviewTab.descriptionHelper")}>
                        <Textarea
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder={t("overviewTab.descriptionPlaceholder")}
                        />
                    </FormField>
                </div>

                <FormField label={t("overviewTab.categoryLabel")} required error={errors.categoryId}>
                    <select
                        value={form.categoryId ?? ""}
                        onChange={(e) =>
                            setForm({ ...form, categoryId: e.target.value ? Number(e.target.value) : undefined })
                        }
                        className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                    >
                        <option value="">{t("overviewTab.categoryPlaceholder")}</option>
                        {categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                                {c.categoryName}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label={t("overviewTab.levelLabel")}>
                    <select
                        value={form.level}
                        onChange={(e) => setForm({ ...form, level: e.target.value as OverviewForm["level"] })}
                        className="h-10 w-full rounded-radius-md border border-transparent bg-surface-muted px-3 text-body text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus:border-brand"
                    >
                        <option value="beginner">{t("overviewTab.levelBeginner")}</option>
                        <option value="intermediate">{t("overviewTab.levelIntermediate")}</option>
                        <option value="advanced">{t("overviewTab.levelAdvanced")}</option>
                    </select>
                </FormField>

                <FormField label={t("overviewTab.priceLabel")} required error={errors.price}>
                    <Input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder={t("overviewTab.pricePlaceholder")}
                    />
                </FormField>

                <FormField label={t("overviewTab.thumbnailLabel")} helperText={t("overviewTab.thumbnailHelper")}>
                    <Input
                        value={form.thumbnail}
                        onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                        placeholder="https://..."
                    />
                </FormField>
            </div>

            <div className="mt-6 flex justify-end">
                <Button variant="primary" loading={saving} onClick={handleSubmit}>
                    {t("overviewTab.save")}
                </Button>
            </div>
        </Card>
    );
};

export default OverviewTab;
