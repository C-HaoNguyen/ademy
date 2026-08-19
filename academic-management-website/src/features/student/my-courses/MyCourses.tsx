import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../../utils/AuthUtils";
import { API_URL, ROUTES } from "@/config/constants";
import { SkeletonCardGrid } from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import { BookOpen } from "lucide-react";

type MyCourse = {
    courseId: number;
    title: string;
    thumbnail?: string;
};

const MyCourses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<MyCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyCourses();
    }, []);

    async function fetchMyCourses() {
        setLoading(true);
        try {
            const res = await fetch(
                `${API_URL}/enrollments/student/me/courses`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${getAccessToken()}`,
                    },
                }
            );
            const data = await res.json();
            setCourses(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <SkeletonCardGrid count={6} />;
    }

    if (courses.length === 0) {
        return (
            <EmptyState
                icon={BookOpen}
                title="Bạn chưa đăng ký khóa học nào"
                description="Khám phá thư viện khóa học và bắt đầu hành trình học tập của bạn."
                action={
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.COURSES)}
                        className="cursor-pointer px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors duration-200"
                    >
                        Khám phá khóa học
                    </button>
                }
            />
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {courses.map(course => (
                <div
                    key={course.courseId}
                    className="bg-white rounded-card shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200"
                >
                    <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-40 w-full object-cover rounded-xl"
                    />
                    <h3 className="mt-3 font-semibold text-ink">
                        {course.title}
                    </h3>
                </div>
            ))}
        </div>
    );
};

export default MyCourses;
