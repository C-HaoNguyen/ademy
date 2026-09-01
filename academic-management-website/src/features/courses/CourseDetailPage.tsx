import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import EnrollSuccessOverlay from "../payment/components/EnrollSuccessOverlay";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useAuth } from "@/shared/auth/useAuth";
import { useToast } from "@/shared/ui/useToast";
import Card from "@/shared/ui/Card";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import Skeleton, { SkeletonText } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import { CheckCircle2, FileQuestion, FileText, HelpCircle, Lock, User, Video } from "lucide-react";

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

type LessonPreview = {
    lessonId: number;
    title: string;
    contentType: "video" | "document" | "quiz";
    duration?: number | null;
    orderIndex: number;
};

const contentTypeIcon: Record<LessonPreview["contentType"], typeof Video> = {
    video: Video,
    document: FileText,
    quiz: HelpCircle,
};

const CourseDetail = () => {
    const { courseId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const { showToast } = useToast();

    const [course, setCourse] = useState<CourseDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);

    const [lessons, setLessons] = useState<LessonPreview[]>([]);
    const [lessonsLoading, setLessonsLoading] = useState(true);
    const [lessonsError, setLessonsError] = useState(false);

    useEffect(() => {
        fetchCourseDetail();
    }, [courseId]);

    useEffect(() => {
        async function fetchLessons() {
            setLessonsLoading(true);
            setLessonsError(false);
            try {
                const res = await apiClient(API_ENDPOINTS.COURSES.LESSONS(courseId as string));
                if (!res.ok) {
                    setLessonsError(true);
                    return;
                }
                const data = await res.json();
                setLessons(data);
            } catch (error) {
                console.error("Load curriculum failed", error);
                setLessonsError(true);
            } finally {
                setLessonsLoading(false);
            }
        }

        fetchLessons();
    }, [courseId]);

    useEffect(() => {
        if (!isLoggedIn || !courseId) {
            setIsEnrolled(false);
            return;
        }

        async function checkEnrollment() {
            try {
                const res = await apiClient(API_ENDPOINTS.ENROLLMENTS.MY_COURSES);
                if (!res.ok) return;
                const data: { courseId: number }[] = await res.json();
                setIsEnrolled(data.some((c) => c.courseId === Number(courseId)));
            } catch (error) {
                console.error("Check enrollment failed", error);
            }
        }

        checkEnrollment();
    }, [isLoggedIn, courseId]);

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
            showToast({ tone: "danger", message: "Đăng ký khóa học thất bại. Vui lòng thử lại." });
        }
    };

    // Lesson Player chưa tồn tại trong hệ thống (Phase 35, chưa implement) — "Xem thử"
    // hiện chỉ thông báo, chưa điều hướng vào nội dung thật.
    const handlePreviewLesson = () => {
        showToast({ tone: "info", message: "Tính năng xem thử sẽ sớm ra mắt." });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background px-6 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-10 w-3/4" />
                        <SkeletonText lines={3} />
                        <Skeleton className="h-40 w-full rounded-radius-lg" />
                    </div>
                    <div className="rounded-radius-lg bg-surface shadow-elevated overflow-hidden">
                        <Skeleton className="h-48 w-full rounded-none" />
                        <div className="p-6 space-y-4">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-12 w-full rounded-radius-md" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-background px-6 py-20">
                <div className="max-w-md mx-auto">
                    <EmptyState
                        icon={FileQuestion}
                        title="Không tìm thấy khóa học"
                        description="Khóa học này có thể đã bị gỡ hoặc đường dẫn không chính xác."
                        action={
                            <Button variant="secondary" size="sm" onClick={() => navigate("/courses")}>
                                Xem tất cả khóa học
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-background px-6 py-12">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* ===== LEFT ===== */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-2"
                    >
                        <h1 className="text-h1 text-primary mb-4">
                            {course.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 text-body-sm text-tertiary mb-6">
                            <span className="inline-flex items-center gap-1.5">
                                <User size={16} aria-hidden="true" />
                                Giảng viên: {course.instructor.fullName}
                            </span>
                            {course.category && (
                                <Badge variant="neutral">{course.category.categoryName}</Badge>
                            )}
                        </div>

                        <p className="text-body-lg text-secondary mb-6">
                            {course.description}
                        </p>

                        <Card variant="marketing" className="mb-6">
                            <h2 className="text-h3 text-primary mb-4">
                                Bạn sẽ học được gì?
                            </h2>

                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-secondary">
                                {[
                                    "Kiến thức nền tảng & nâng cao",
                                    "Thực hành theo dự án",
                                    "Tư duy hệ thống",
                                    "Chuẩn bị đi làm",
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <CheckCircle2 size={18} className="text-status-success-icon shrink-0 mt-0.5" aria-hidden="true" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Card>

                        {/* ===== Curriculum (PRD-006/007, §2.3) ===== */}
                        <Card variant="marketing">
                            <h2 className="text-h3 text-primary mb-4">
                                Nội dung khóa học
                            </h2>

                            {lessonsLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-10 w-full rounded-radius-md" />
                                    <Skeleton className="h-10 w-full rounded-radius-md" />
                                    <Skeleton className="h-10 w-full rounded-radius-md" />
                                </div>
                            ) : lessonsError ? (
                                <p className="text-body-sm text-status-danger-text">
                                    Không thể tải nội dung khóa học. Vui lòng thử lại sau.
                                </p>
                            ) : lessons.length === 0 ? (
                                <p className="text-body-sm text-tertiary">
                                    Nội dung đang được cập nhật.
                                </p>
                            ) : (
                                <ul className="divide-y divide-default">
                                    {lessons
                                        .slice()
                                        .sort((a, b) => a.orderIndex - b.orderIndex)
                                        .map((lesson) => {
                                            const Icon = contentTypeIcon[lesson.contentType] ?? FileText;
                                            return (
                                                <li key={lesson.lessonId} className="py-3 flex items-center gap-3">
                                                    <Icon size={18} className="text-brand shrink-0" aria-hidden="true" />
                                                    <button
                                                        type="button"
                                                        onClick={handlePreviewLesson}
                                                        className="cursor-pointer flex-1 text-left text-body text-primary hover:text-brand transition-colors"
                                                    >
                                                        {lesson.title}
                                                    </button>
                                                    <Badge variant="neutral">Xem thử</Badge>
                                                </li>
                                            );
                                        })}
                                </ul>
                            )}

                            {!lessonsLoading && !lessonsError && (
                                <p className="mt-4 flex items-center gap-1.5 text-caption text-tertiary">
                                    <Lock size={12} aria-hidden="true" />
                                    Các bài học còn lại sẽ được mở khi bạn mua khóa học.
                                </p>
                            )}
                        </Card>
                    </motion.div>

                    {/* ===== RIGHT ===== */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="sticky top-24 h-fit"
                    >
                        <Card variant="marketing" padding="p-0" className="overflow-hidden">
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-48 object-cover"
                            />

                            <div className="p-6">
                                <div className="mb-4 text-h1 text-primary">
                                    {course.price
                                        ? `${course.price.toLocaleString()}₫`
                                        : "Miễn phí"}
                                </div>

                                {isEnrolled ? (
                                    <Button
                                        variant="cta"
                                        size="lg"
                                        className="w-full"
                                        onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                                    >
                                        Vào học ngay
                                    </Button>
                                ) : (
                                    <Button variant="cta" size="lg" className="w-full" onClick={handleRegister}>
                                        Mua khóa học
                                    </Button>
                                )}

                                <p className="mt-4 text-center text-body-sm text-tertiary">
                                    Hoàn tiền trong 30 ngày nếu không hài lòng
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>

            <EnrollSuccessOverlay
                open={success}
                onClose={() => setSuccess(false)}
            />
        </>
    );
};

export default CourseDetail;
