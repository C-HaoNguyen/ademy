import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { useCourseTestsQuery } from "@/shared/api/queries/useCourseTestsQuery";
import Card from "@/shared/ui/Card";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";
import { useToast } from "@/shared/ui/useToast";

const TestPractice = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const testsQuery = useCourseTestsQuery();
    const tests = testsQuery.data ?? [];

    useEffect(() => {
        if (testsQuery.isError) {
            showToast({ tone: "danger", message: "Không thể tải danh sách bài kiểm tra" });
        }
    }, [testsQuery.isError, showToast]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-h1 text-primary">Bài kiểm tra</h1>
                <p className="text-body-sm text-secondary mt-1">
                    Danh sách bài kiểm tra tổng khóa học từ các khóa bạn đã mua
                </p>
            </div>

            {testsQuery.isLoading ? (
                <Card variant="app">
                    <SkeletonText lines={6} />
                </Card>
            ) : testsQuery.isError ? (
                <EmptyState
                    icon={ClipboardList}
                    title="Không thể tải danh sách bài kiểm tra"
                    description="Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
                    action={
                        <Button variant="primary" size="sm" onClick={() => testsQuery.refetch()}>
                            Thử lại
                        </Button>
                    }
                />
            ) : tests.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title="Bạn chưa có bài kiểm tra nào"
                    description="Mua khóa học có bài kiểm tra tổng để bắt đầu luyện tập."
                    action={
                        <Button variant="primary" onClick={() => navigate(ROUTES.COURSES)}>
                            Khám phá khóa học
                        </Button>
                    }
                />
            ) : (
                <ul className="space-y-3">
                    {tests.map((test) => (
                        <li key={test.quizId}>
                            <Card variant="app" className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-body font-medium text-primary truncate">
                                        {test.quizTitle}
                                    </p>
                                    <p className="text-body-sm text-secondary truncate">{test.courseTitle}</p>
                                    <div className="mt-2">
                                        {test.attempted ? (
                                            <Badge variant="status" tone="success">
                                                Đã hoàn thành — điểm {test.bestScore?.toFixed(1) ?? "—"}
                                            </Badge>
                                        ) : (
                                            <Badge variant="status" tone="warning">Chưa làm</Badge>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant={test.attempted ? "secondary" : "primary"}
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => navigate(ROUTES.STUDENT.QUIZ_COURSE(test.courseId))}
                                >
                                    {test.attempted ? "Xem kết quả" : "Làm bài"}
                                </Button>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TestPractice;
