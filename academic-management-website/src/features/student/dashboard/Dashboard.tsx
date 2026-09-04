import { BookOpen, CheckCircle, TrendingUp, PlayCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/constants";
import { useMyCoursesQuery } from "@/shared/api/queries/useMyCoursesQuery";
import { useTotalCoursesQuery, useQuizAttemptSummaryQuery } from "@/shared/api/queries/useStudentSummaryQuery";
import Card from "@/shared/ui/Card";
import StatCard from "@/shared/ui/StatCard";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";

const Dashboard = () => {
    const navigate = useNavigate();
    const totalCoursesQuery = useTotalCoursesQuery();
    const quizAttemptSummaryQuery = useQuizAttemptSummaryQuery();
    const myCoursesQuery = useMyCoursesQuery();

    const recentCourses = [...(myCoursesQuery.data ?? [])]
        .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-h2 text-primary">Student Dashboard</h2>
                <p className="text-body-sm text-secondary mt-1">
                    Theo dõi tiến độ học tập và hoạt động gần đây
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={<BookOpen size={22} aria-hidden="true" />}
                    label="Khóa học đã đăng ký"
                    value={totalCoursesQuery.data ?? 0}
                    loading={totalCoursesQuery.isLoading}
                />
                <StatCard
                    icon={<CheckCircle size={22} aria-hidden="true" />}
                    label="Bài test đã làm"
                    value={quizAttemptSummaryQuery.data?.attemptCount ?? 0}
                    loading={quizAttemptSummaryQuery.isLoading}
                />
                <StatCard
                    icon={<TrendingUp size={22} aria-hidden="true" />}
                    label="Tiến độ trung bình"
                    pendingText="Sắp ra mắt"
                />
            </div>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <PlayCircle size={18} aria-hidden="true" />
                    Tiếp tục học
                </h3>

                {myCoursesQuery.isLoading ? (
                    <SkeletonText lines={3} />
                ) : recentCourses.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="Bạn chưa có khóa học nào"
                        description="Khám phá thư viện khóa học và bắt đầu hành trình học tập của bạn."
                        action={
                            <Button variant="primary" onClick={() => navigate(ROUTES.COURSES)}>
                                Khám phá khóa học
                            </Button>
                        }
                    />
                ) : (
                    <ul className="space-y-3">
                        {recentCourses.map((course) => (
                            <li
                                key={course.courseId}
                                className="flex items-center justify-between gap-4 rounded-radius-md border border-default p-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-body font-medium text-primary truncate">
                                        {course.title}
                                    </p>
                                    {course.instructorName && (
                                        <p className="text-body-sm text-secondary truncate">
                                            {course.instructorName}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                                >
                                    Vào học
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                    <Zap size={18} aria-hidden="true" />
                    Quick Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}>
                        Tiếp tục học
                    </Button>
                    <Button variant="cta" onClick={() => navigate(ROUTES.COURSES)}>
                        Khám phá khóa học
                    </Button>
                    <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT.PROFILE)}>
                        Hồ sơ cá nhân
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
