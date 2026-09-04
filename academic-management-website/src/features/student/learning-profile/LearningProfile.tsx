import { useNavigate } from "react-router-dom";
import { BookOpen, CheckCircle, Award } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { useMyCoursesQuery } from "@/shared/api/queries/useMyCoursesQuery";
import { useQuizAttemptSummaryQuery } from "@/shared/api/queries/useStudentSummaryQuery";
import Card from "@/shared/ui/Card";
import StatCard from "@/shared/ui/StatCard";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";

const LearningProfile = () => {
    const navigate = useNavigate();
    const quizAttemptSummaryQuery = useQuizAttemptSummaryQuery();
    const myCoursesQuery = useMyCoursesQuery();

    const courses = myCoursesQuery.data ?? [];
    const averageScore = quizAttemptSummaryQuery.data?.averageScore;

    return (
        <div className="space-y-8">
            <h1 className="text-h1 text-primary">Hồ sơ học tập</h1>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    icon={<BookOpen size={22} aria-hidden="true" />}
                    label="Tổng số khóa học"
                    value={courses.length}
                    loading={myCoursesQuery.isLoading}
                />
                <StatCard
                    icon={<CheckCircle size={22} aria-hidden="true" />}
                    label="Tổng bài test đã làm"
                    value={quizAttemptSummaryQuery.data?.attemptCount ?? 0}
                    loading={quizAttemptSummaryQuery.isLoading}
                />
                <StatCard
                    icon={<Award size={22} aria-hidden="true" />}
                    label="Điểm trung bình"
                    value={averageScore != null ? averageScore.toFixed(1) : "—"}
                    loading={quizAttemptSummaryQuery.isLoading}
                />
            </div>

            <Card variant="app">
                <h3 className="font-semibold text-primary mb-4">Chi tiết theo khóa học</h3>

                {myCoursesQuery.isLoading ? (
                    <SkeletonText lines={4} />
                ) : courses.length === 0 ? (
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
                        {courses.map((course) => (
                            <li key={course.courseId}>
                                <button
                                    type="button"
                                    onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                                    className="w-full flex items-center justify-between gap-4 rounded-radius-md border border-default p-3 text-left hover:bg-surface-muted transition-colors"
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
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default LearningProfile;
