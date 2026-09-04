import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/constants";
import { useMyCoursesQuery } from "@/shared/api/queries/useMyCoursesQuery";
import { SkeletonCardGrid } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import { BookOpen } from "lucide-react";

const MyCourses = () => {
    const navigate = useNavigate();
    const { data: courses = [], isLoading } = useMyCoursesQuery();

    if (isLoading) {
        return <SkeletonCardGrid count={6} />;
    }

    if (courses.length === 0) {
        return (
            <EmptyState
                icon={BookOpen}
                title="Bạn chưa mua khóa học nào"
                description="Khám phá thư viện khóa học và bắt đầu hành trình học tập của bạn."
                action={
                    <Button variant="primary" onClick={() => navigate(ROUTES.COURSES)}>
                        Khám phá khóa học
                    </Button>
                }
            />
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {courses.map((course) => (
                <Card key={course.courseId} variant="app">
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-40 w-full object-cover rounded-radius-md"
                    />
                    <h3 className="mt-3 font-semibold text-primary">{course.title}</h3>
                    {course.instructorName && (
                        <p className="text-body-sm text-secondary">{course.instructorName}</p>
                    )}
                    <p className="text-caption text-tertiary mt-1">
                        Ngày mua: {new Date(course.enrolledAt).toLocaleDateString("vi-VN")}
                    </p>
                    <Button
                        variant="primary"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                    >
                        Vào học
                    </Button>
                </Card>
            ))}
        </div>
    );
};

export default MyCourses;
