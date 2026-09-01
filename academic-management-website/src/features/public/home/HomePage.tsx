import { useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Users, GraduationCap, Star } from "lucide-react";
import { useCoursesQuery } from "@/shared/api/queries/useCoursesQuery";
import CourseCard from "@/features/courses/components/CourseCard";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";

const HomePage = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const coursesQuery = useCoursesQuery();
    const featuredCourses = (coursesQuery.data ?? []).slice(0, 8);
    const totalCourses = coursesQuery.isLoading ? null : (coursesQuery.data?.length ?? 0);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;

        const scrollAmount = 320;

        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <div className="bg-background">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-surface">
                <div className="relative mx-auto max-w-7xl px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    {/* LEFT CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-radius-full bg-surface-brand-muted text-brand text-body-sm font-medium mb-6">
                            <Sparkles size={16} aria-hidden="true" />
                            Nền tảng học tập thế hệ mới
                        </div>

                        <h1 className="text-h1 md:text-[40px] md:leading-[48px] text-primary">
                            Học tập & quản lý <br />
                            <span className="text-brand">
                                trực tuyến toàn diện
                            </span>
                        </h1>

                        <p className="mt-6 text-body-lg text-secondary max-w-xl">
                            Ademy giúp bạn theo dõi tiến trình học tập, quản lý khóa học
                            và nâng cao hiệu quả học tập với trải nghiệm hiện đại,
                            nhanh chóng và thông minh.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-4">
                            <Button variant="cta" size="lg" onClick={() => navigate("/courses")}>
                                Khám phá khóa học
                            </Button>
                            <Button variant="secondary" size="lg" onClick={() => navigate("/signup")}>
                                Bắt đầu miễn phí
                            </Button>
                        </div>

                        {/* TODO(Phase 26 follow-up): "2,100+ học viên" là số liệu tĩnh — chưa có
                            endpoint public trả tổng số học viên thật (chỉ có ADMIN.TOTAL_USERS,
                            yêu cầu ROLE_ADMIN). Thay bằng số liệu thật khi có endpoint public. */}
                        <div className="mt-10 flex items-center gap-2 text-body-sm text-tertiary">
                            <Users size={18} className="text-brand" aria-hidden="true" />
                            <span>2,100+ học viên đã tham gia</span>
                        </div>
                    </motion.div>

                    {/* RIGHT VISUAL */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative flex items-center justify-center"
                        aria-hidden="true"
                    >
                        <GraduationCap size={220} strokeWidth={1} className="text-brand/30" />
                    </motion.div>
                </div>
            </section>

            <div className="relative mt-16">
                {/* LEFT ARROW */}
                <button
                    type="button"
                    onClick={() => scroll("left")}
                    aria-label="Cuộn sang trái"
                    className="hidden sm:flex cursor-pointer absolute -left-4 top-1/2 -translate-y-1/2 z-sticky
                   bg-surface shadow-elevated rounded-radius-full w-10 h-10
                   items-center justify-center hover:bg-surface-muted transition-colors duration-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                    <ArrowLeft className="w-5 h-5 text-secondary" aria-hidden="true" />
                </button>

                {/* RIGHT ARROW */}
                <button
                    type="button"
                    onClick={() => scroll("right")}
                    aria-label="Cuộn sang phải"
                    className="hidden sm:flex cursor-pointer absolute -right-4 top-1/2 -translate-y-1/2 z-sticky
                   bg-surface shadow-elevated rounded-radius-full w-10 h-10
                   items-center justify-center hover:bg-surface-muted transition-colors duration-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                    <ArrowRight className="w-5 h-5 text-secondary" aria-hidden="true" />
                </button>

                {/* SCROLL CONTAINER — dữ liệu khóa học thật (§2.1), không còn card gradient tùy ý */}
                <div className="mx-auto max-w-7xl px-6">
                    {coursesQuery.isLoading ? (
                        <div className="flex gap-6 overflow-x-hidden py-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="min-w-[280px] h-64 rounded-radius-lg bg-surface-muted animate-pulse" />
                            ))}
                        </div>
                    ) : featuredCourses.length === 0 ? (
                        <EmptyState
                            icon={GraduationCap}
                            title="Chưa có khóa học nào"
                            description="Khóa học sẽ sớm xuất hiện tại đây."
                        />
                    ) : (
                        <div
                            ref={scrollRef}
                            className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar py-4"
                        >
                            {featuredCourses.map((course, index) => (
                                <div key={course.courseId} className="min-w-[280px] max-w-[280px]">
                                    <CourseCard course={course} index={index} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* FEATURES */}
            <section className="py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-h2 text-center text-primary"
                    >
                        Vì sao chọn Ademy?
                    </motion.h2>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: GraduationCap,
                                title: "Quản lý khóa học thông minh",
                                desc: "Tạo, chỉnh sửa và theo dõi khóa học dễ dàng."
                            },
                            {
                                icon: Sparkles,
                                title: "Theo dõi tiến độ học tập",
                                desc: "Thống kê, báo cáo chi tiết cho từng học viên."
                            },
                            {
                                icon: Star,
                                title: "Trải nghiệm học tập hiện đại",
                                desc: "Giao diện tối ưu cho mọi thiết bị."
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <Card variant="marketing">
                                    <div className="w-11 h-11 rounded-radius-md bg-surface-brand-muted text-brand flex items-center justify-center mb-4">
                                        <item.icon size={22} aria-hidden="true" />
                                    </div>
                                    <h3 className="text-h4 text-primary">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-secondary">
                                        {item.desc}
                                    </p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="bg-action-primary-bg py-16">
                <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-inverse">
                    {[
                        // TODO(Phase 26 follow-up): "Học viên"/"Giảng viên"/"Đánh giá" vẫn hardcode —
                        // chưa có API public phù hợp (Học viên/Đánh giá không có endpoint public nào;
                        // Giảng viên có thể derive từ /courses như LecturerPage nhưng chưa nối ở đây
                        // để tránh 2 cách tính khác nhau cho cùng 1 khái niệm trong 1 lần redesign).
                        // "Khóa học" đã là số liệu thật (totalCourses, từ GET /courses).
                        { value: "2,000+", label: "Học viên" },
                        { value: totalCourses === null ? null : totalCourses, label: "Khóa học" },
                        { value: "35+", label: "Giảng viên" },
                        { value: "4.8★", label: "Đánh giá" },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            {stat.value === null ? (
                                <div className="h-9 w-16 mx-auto rounded-radius-md bg-inverse/20 animate-pulse" />
                            ) : (
                                <div className="text-h1">
                                    {stat.value}
                                </div>
                            )}
                            <div className="mt-2 text-inverse/90">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-3xl px-6 text-center"
                >
                    <h2 className="text-h2 text-primary">
                        Sẵn sàng bắt đầu hành trình học tập?
                    </h2>
                    <p className="mt-4 text-secondary">
                        Tham gia Ademy ngay hôm nay để quản lý và học tập hiệu quả hơn.
                    </p>
                    <div className="mt-8">
                        <Button variant="primary" onClick={() => navigate("/signup")}>
                            Đăng ký miễn phí
                        </Button>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default HomePage;
