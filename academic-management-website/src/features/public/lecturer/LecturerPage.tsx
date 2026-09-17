import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap } from "lucide-react";
import InstructorCard, { type Instructor } from "../components/InstructorCard";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonCardGrid } from "@/shared/ui/Skeleton";
import { useCoursesQuery } from "@/shared/api/queries/useCoursesQuery";

const LecturerPage = () => {
    const { t } = useTranslation("public");
    const navigate = useNavigate();
    const coursesQuery = useCoursesQuery();

    // Không có endpoint public trả danh sách Teacher thật (endpoint thật duy nhất,
    // GET /admin/instructors, yêu cầu ROLE_ADMIN) — derive từ catalog course public
    // (đã publish), theo quyết định phạm vi Phase 26. Teacher chưa có course nào sẽ
    // không xuất hiện ở đây.
    const instructors = useMemo<Instructor[]>(() => {
        const byUsername = new Map<string, Instructor>();
        for (const course of coursesQuery.data ?? []) {
            const username = course.instructor?.username;
            const fullName = course.instructor?.fullName;
            if (!username || !fullName) continue;

            const existing = byUsername.get(username);
            if (existing) {
                existing.courseCount += 1;
            } else {
                byUsername.set(username, { username, fullName, courseCount: 1 });
            }
        }
        return Array.from(byUsername.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [coursesQuery.data]);

    return (
        <div className="bg-background">
            {/* HERO */}
            <section className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-h1 text-primary"
                    >
                        {t("lecturer.heroTitle")}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-4 text-body-lg text-secondary max-w-2xl mx-auto"
                    >
                        {t("lecturer.heroSubtitle")}
                    </motion.p>
                </div>
            </section>

            {/* LECTURER LIST */}
            <section className="pb-20">
                <div className="mx-auto max-w-7xl px-6">
                    {coursesQuery.isLoading ? (
                        <SkeletonCardGrid count={4} />
                    ) : coursesQuery.isError ? (
                        <EmptyState
                            icon={GraduationCap}
                            title={t("lecturer.errorTitle")}
                            description={t("lecturer.errorDescription")}
                            action={
                                <Button variant="primary" size="sm" onClick={() => coursesQuery.refetch()}>
                                    {t("lecturer.retry")}
                                </Button>
                            }
                        />
                    ) : instructors.length === 0 ? (
                        <EmptyState
                            icon={GraduationCap}
                            title={t("lecturer.emptyTitle")}
                            description={t("lecturer.emptyDescription")}
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                            {instructors.map((instructor, index) => (
                                <InstructorCard
                                    key={instructor.username}
                                    instructor={instructor}
                                    index={index}
                                    onClick={() => navigate(`/courses?instructor=${encodeURIComponent(instructor.username)}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-surface">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-3xl px-6 text-center"
                >
                    <h2 className="text-h2 text-primary">
                        {t("lecturer.ctaTitle")}
                    </h2>
                    <p className="mt-4 text-secondary">
                        {t("lecturer.ctaSubtitle")}
                    </p>
                    <div className="mt-8">
                        <Button variant="primary" onClick={() => navigate("/courses")}>
                            {t("lecturer.ctaButton")}
                        </Button>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default LecturerPage;
