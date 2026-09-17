import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/config/constants";
import { useMyCoursesQuery } from "@/shared/api/queries/useMyCoursesQuery";
import { SkeletonCardGrid } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import { BookOpen } from "lucide-react";

const MyCourses = () => {
    const { t } = useTranslation("student");
    const navigate = useNavigate();
    const { data: courses = [], isLoading } = useMyCoursesQuery();

    if (isLoading) {
        return <SkeletonCardGrid count={6} />;
    }

    if (courses.length === 0) {
        return (
            <EmptyState
                icon={BookOpen}
                title={t("myCourses.emptyTitle")}
                description={t("myCourses.emptyDescription")}
                action={
                    <Button variant="primary" onClick={() => navigate(ROUTES.COURSES)}>
                        {t("myCourses.exploreCourses")}
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
                        {t("myCourses.purchasedDate")} {new Date(course.enrolledAt).toLocaleDateString("vi-VN")}
                    </p>
                    <Button
                        variant="primary"
                        size="sm"
                        className="mt-4 w-full"
                        onClick={() => navigate(ROUTES.STUDENT.LEARN(course.courseId))}
                    >
                        {t("myCourses.goToLearning")}
                    </Button>
                </Card>
            ))}
        </div>
    );
};

export default MyCourses;
