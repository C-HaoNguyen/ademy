import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import EnrollSuccessOverlay from "../payment/components/EnrollSuccessOverlay";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useAuth } from "@/shared/auth/useAuth";
import Skeleton, { SkeletonText } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import Toast from "@/shared/ui/Toast";
import { CheckCircle2, FileQuestion, User } from "lucide-react";

type CourseDetailType = {
    courseId: number;
    title: string;
    description: string;
    price: number;
    instructor: {
        username: string;
        fullName: string;
    };
    category?: {
        categoryId: number;
        categoryName: string;
    };
    thumbnail?: string;
};

const CourseDetail = () => {
    const { courseId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const [course, setCourse] = useState<CourseDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        fetchCourseDetail();
    }, [courseId]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    async function fetchCourseDetail() {
        setLoading(true);
        try {
            const res = await apiClient(API_ENDPOINTS.COURSES.DETAIL(courseId as string));

            if (!res.ok) {
                setCourse(null);
                return;
            }

            const data = await res.json();
            setCourse({
                ...data,
                price: Number(data.price),
            });
        } catch (error) {
            console.error("Load course detail failed", error);
            setCourse(null);
        } finally {
            setLoading(false);
        }
    }

    const handleRegister = async () => {
        if (!isLoggedIn) {
            navigate("/login", {
                state: { from: location.pathname },
            });
            return;
        }

        try {
            const res = await apiClient(API_ENDPOINTS.ENROLLMENTS.CREATE, {
                method: "POST",
                body: JSON.stringify({
                    courseId: course?.courseId,
                }),
            });

            if (!res.ok) {
                throw new Error("Enroll failed!");
            }

            // Đăng ký thành công
            setSuccess(true);
        } catch (err) {
            console.error(err);
            setToast({ message: "Đăng ký khóa học thất bại. Vui lòng thử lại.", type: "error" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-legacy-surface px-6 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-10 w-3/4" />
                        <SkeletonText lines={3} />
                        <Skeleton className="h-40 w-full rounded-card" />
                    </div>
                    <div className="rounded-card bg-white shadow-lg overflow-hidden">
                        <Skeleton className="h-48 w-full rounded-none" />
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-legacy-surface px-6 py-20">
                <div className="max-w-md mx-auto">
                    <EmptyState
                        icon={FileQuestion}
                        title="Không tìm thấy khóa học"
                        description="Khóa học này có thể đã bị gỡ hoặc đường dẫn không chính xác."
                        action={
                            <button
                                type="button"
                                onClick={() => navigate("/courses")}
                                className="cursor-pointer px-5 py-2 rounded-xl bg-legacy-primary text-white text-sm font-medium hover:bg-legacy-primary-dark transition-colors duration-200"
                            >
                                Xem tất cả khóa học
                            </button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-legacy-surface px-6 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* ===== LEFT ===== */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-2"
                    >
                        <h1 className="text-4xl font-bold text-legacy-ink mb-4">
                            {course.title}
                        </h1>

                        <p className="text-slate-600 mb-6">
                            {course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-6">
                            <span className="inline-flex items-center gap-1.5">
                                <User size={16} aria-hidden="true" />
                                Giảng viên: {course.instructor.fullName}
                            </span>
                            {course.category && (
                                <span className="px-3 py-1 text-xs bg-legacy-primary/10 text-legacy-primary rounded-full">{course.category?.categoryName}</span>
                            )}
                        </div>

                        <div className="rounded-card bg-white p-6 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-semibold text-legacy-ink mb-4">
                                Bạn sẽ học được gì?
                            </h2>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                                {[
                                    "Kiến thức nền tảng & nâng cao",
                                    "Thực hành theo dự án",
                                    "Tư duy hệ thống",
                                    "Chuẩn bị đi làm",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <CheckCircle2 size={18} className="text-legacy-success shrink-0 mt-0.5" aria-hidden="true" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* ===== RIGHT ===== */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="sticky top-24 h-fit rounded-card bg-white shadow-lg overflow-hidden border border-slate-100"
                    >
                        <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-48 object-cover"
                        />

                        <div className="p-6">
                            <div className="mb-4 text-3xl font-bold text-legacy-ink">
                                {course.price
                                    ? `${course.price.toLocaleString()}₫`
                                    : "Miễn phí"}
                            </div>

                            <button
                                type="button"
                                onClick={handleRegister}
                                className="cursor-pointer w-full rounded-xl bg-legacy-cta px-6 py-3
                                       font-semibold text-white hover:bg-legacy-cta-dark transition-colors duration-200"
                            >
                                Đăng ký khóa học
                            </button>

                            <p className="mt-4 text-center text-sm text-slate-500">
                                Hoàn tiền trong 30 ngày nếu không hài lòng
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <EnrollSuccessOverlay
                open={success}
                onClose={() => setSuccess(false)}
            />

            {toast && <Toast message={toast.message} type={toast.type} />}
        </>
    );
};

export default CourseDetail;
