import { motion } from "framer-motion";
import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, Users, GraduationCap, Star } from "lucide-react";
import { useCoursesQuery } from "@/shared/api/queries/useCoursesQuery";

const HomePage = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const coursesQuery = useCoursesQuery();
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
        <div className="bg-surface">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-white">

                {/* background glow */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-primary-light/10 rounded-full blur-3xl opacity-60" />
                <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-cta/10 rounded-full blur-3xl opacity-60" />

                <div className="relative mx-auto max-w-7xl px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                    {/* LEFT CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >

                        {/* badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <Sparkles size={16} aria-hidden="true" />
                            Nền tảng học tập thế hệ mới
                        </div>

                        {/* heading */}
                        <h1 className="text-4xl md:text-6xl font-bold text-ink leading-tight">
                            Học tập & quản lý <br />
                            <span className="text-primary">
                                trực tuyến toàn diện
                            </span>
                        </h1>

                        {/* description */}
                        <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-xl">
                            Ademy giúp bạn theo dõi tiến trình học tập, quản lý khóa học
                            và nâng cao hiệu quả học tập với trải nghiệm hiện đại,
                            nhanh chóng và thông minh.
                        </p>

                        {/* CTA */}
                        <div className="mt-8 flex flex-wrap gap-4">

                            <NavLink
                                to="/courses"
                                className="cursor-pointer px-7 py-3 rounded-xl bg-cta text-white font-medium
                     hover:bg-cta-dark hover:shadow-lg transition-colors duration-200"
                            >
                                Khám phá khóa học
                            </NavLink>

                            <NavLink
                                to="/signup"
                                className="cursor-pointer px-7 py-3 rounded-xl border border-slate-300 text-ink
                     hover:bg-slate-50 transition-colors duration-200"
                            >
                                Bắt đầu miễn phí
                            </NavLink>

                        </div>

                        {/* social proof */}
                        <div className="mt-10 flex items-center gap-2 text-sm text-slate-500">
                            <Users size={18} className="text-primary" aria-hidden="true" />
                            <span>2,100+ học viên đã tham gia</span>
                        </div>

                    </motion.div>


                    {/* RIGHT VISUAL */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >

                        {/* main card */}
                        <div className="rounded-card bg-white shadow-2xl p-6 border border-slate-100">

                            <div className="flex justify-between items-center mb-6">
                                <div className="text-lg font-semibold text-ink">Tiến trình học</div>
                                <div className="text-sm text-success font-medium">+12%</div>
                            </div>

                            <div className="space-y-4">

                                <div>
                                    <div className="flex justify-between text-sm mb-1 text-ink">
                                        <span>React Mastery</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full">
                                        <div className="h-2 bg-primary rounded-full w-3/4" />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-1 text-ink">
                                        <span>UI Design</span>
                                        <span>50%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full">
                                        <div className="h-2 bg-primary-light rounded-full w-1/2" />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* floating mini card */}
                        <div className="absolute -bottom-6 -left-6 bg-white shadow-xl rounded-2xl px-5 py-4 border border-slate-100">
                            <div className="text-sm text-slate-500">Khóa học hoàn thành</div>
                            <div className="text-2xl font-bold text-ink">24</div>
                        </div>

                    </motion.div>

                </div>
            </section>

            <div className="relative mt-16">

                {/* LEFT ARROW */}
                <button
                    type="button"
                    onClick={() => scroll("left")}
                    aria-label="Cuộn sang trái"
                    className="cursor-pointer absolute -left-4 top-1/2 -translate-y-1/2 z-10
                   bg-white shadow-md rounded-full w-10 h-10
                   flex items-center justify-center hover:bg-slate-100 transition-colors duration-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" aria-hidden="true" />
                </button>

                {/* RIGHT ARROW */}
                <button
                    type="button"
                    onClick={() => scroll("right")}
                    aria-label="Cuộn sang phải"
                    className="cursor-pointer absolute -right-4 top-1/2 -translate-y-1/2 z-10
                   bg-white shadow-md rounded-full w-10 h-10
                   flex items-center justify-center hover:bg-slate-100 transition-colors duration-200
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    <ArrowRight className="w-5 h-5 text-slate-600" aria-hidden="true" />
                </button>

                {/* SCROLL CONTAINER */}
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar px-6 py-4"
                >
                    {[
                        {
                            title: "Frontend",
                            desc: "HTML, CSS, JavaScript, React từ cơ bản đến nâng cao.",
                            gradient: "from-blue-500 to-blue-700"
                        },
                        {
                            title: "Backend",
                            desc: "Spring Boot, REST API, Database & hệ thống thực tế.",
                            gradient: "from-indigo-500 to-indigo-700"
                        },
                        {
                            title: "Fullstack",
                            desc: "Xây dựng hệ thống hoàn chỉnh từ A-Z.",
                            gradient: "from-purple-500 to-purple-700"
                        },
                        {
                            title: "Database",
                            desc: "SQL, NoSQL và tối ưu dữ liệu.",
                            gradient: "from-green-500 to-green-700"
                        },
                        {
                            title: "DevOps",
                            desc: "CI/CD, Docker, Deployment thực tế.",
                            gradient: "from-orange-500 to-orange-700"
                        },
                        {
                            title: "AI & ML",
                            desc: "Machine Learning & ứng dụng AI.",
                            gradient: "from-pink-500 to-pink-700"
                        },
                        {
                            title: "UI/UX",
                            desc: "Thiết kế trải nghiệm người dùng chuyên nghiệp.",
                            gradient: "from-cyan-500 to-cyan-700"
                        },
                    ].map((course, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ y: -10, scale: 1.02 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 20
                            }}
                            className={`min-w-[280px] rounded-3xl p-8 text-white 
                            bg-gradient-to-br ${course.gradient}
                            shadow-lg cursor-pointer`}
                        >
                            <h3 className="text-xl font-semibold">
                                {course.title}
                            </h3>

                            <p className="mt-4 text-sm opacity-90">
                                {course.desc}
                            </p>

                            <div className="mt-8">
                                <NavLink
                                    to="/courses"
                                    className="inline-block px-5 py-2 rounded-full
                                   bg-white text-gray-900 text-sm font-medium
                                   hover:bg-gray-100 transition"
                                >
                                    Khám phá →
                                </NavLink>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* FEATURES */}
            <section className="py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl font-bold text-center text-ink"
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
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                className="bg-white p-6 rounded-card shadow-sm border border-slate-100
                                           hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                                    <item.icon size={22} aria-hidden="true" />
                                </div>
                                <h3 className="text-lg font-semibold text-ink">
                                    {item.title}
                                </h3>
                                <p className="mt-3 text-slate-600">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="bg-primary py-16">
                <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
                    {[
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
                                <div className="h-9 w-16 mx-auto rounded-md bg-white/20 animate-pulse" />
                            ) : (
                                <div className="text-3xl font-bold">
                                    {stat.value}
                                </div>
                            )}
                            <div className="mt-2 text-primary-light/90">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-3xl px-6 text-center"
                >
                    <h2 className="text-3xl font-bold text-ink">
                        Sẵn sàng bắt đầu hành trình học tập?
                    </h2>
                    <p className="mt-4 text-slate-600">
                        Tham gia Ademy ngay hôm nay để quản lý và học tập hiệu quả hơn.
                    </p>
                    <NavLink
                        to="/signup"
                        className="cursor-pointer inline-block mt-8 px-8 py-3 rounded-xl
                                   bg-cta text-white font-medium
                                   hover:bg-cta-dark transition-colors duration-200 shadow-sm"
                    >
                        Đăng ký miễn phí
                    </NavLink>
                </motion.div>
            </section>
        </div>
    );
};

export default HomePage;
