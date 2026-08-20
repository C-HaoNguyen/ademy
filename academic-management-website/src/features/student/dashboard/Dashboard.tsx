import {
    BookOpen,
    Clock,
    CheckCircle,
    TrendingUp,
    PlayCircle,
    Zap,
    Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

const StatCard = ({
    icon,
    label,
    value,
    loading,
    comingSoon,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string | number;
    loading?: boolean;
    comingSoon?: boolean;
}) => (
    <div className="bg-white rounded-card p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                {loading ? (
                    <div className="mt-2 h-7 w-14 rounded-md bg-slate-200 animate-pulse" />
                ) : comingSoon ? (
                    <p className="text-xs font-medium text-slate-400 mt-2 inline-block px-2 py-1 rounded-full bg-slate-100">
                        Sắp ra mắt
                    </p>
                ) : (
                    <p className="text-2xl font-bold text-ink mt-1">
                        {value}
                    </p>
                )}
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                {icon}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [totalCourses, setTotalCourses] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient(API_ENDPOINTS.ENROLLMENTS.MY_SUMMARY)
            .then((res) => res.json())
            .then((data) => {
                setTotalCourses(data.totalCourses);
            })
            .catch((err) => {
                console.error("Failed to load dashboard summary", err);
                setTotalCourses(0);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8">
            {/* Title */}
            <div>
                <h2 className="text-2xl font-semibold text-ink">
                    Student Dashboard
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    Theo dõi tiến độ học tập và hoạt động gần đây
                </p>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<BookOpen size={22} aria-hidden="true" />}
                    label="Khóa học đã đăng ký"
                    value={totalCourses ?? 0}
                    loading={loading}
                />
                <StatCard
                    icon={<CheckCircle size={22} aria-hidden="true" />}
                    label="Khóa học hoàn thành"
                    comingSoon
                />
                <StatCard
                    icon={<Clock size={22} aria-hidden="true" />}
                    label="Giờ học đã học"
                    comingSoon
                />
                <StatCard
                    icon={<TrendingUp size={22} aria-hidden="true" />}
                    label="Tiến độ trung bình"
                    comingSoon
                />
            </div>

            {/* Middle section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current courses */}
                <div className="bg-white rounded-card p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
                        <PlayCircle size={18} aria-hidden="true" />
                        Khóa học đang học
                    </h3>

                    <div className="flex flex-col items-center justify-center text-center py-6 text-sm text-slate-500">
                        <p>Tính năng theo dõi tiến độ từng khóa học sắp ra mắt.</p>
                        <button
                            type="button"
                            onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                            className="cursor-pointer mt-3 text-primary font-medium hover:underline"
                        >
                            Xem khóa học của tôi
                        </button>
                    </div>
                </div>

                {/* Learning stats */}
                <div className="bg-white rounded-card p-5 shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
                        <Activity size={18} aria-hidden="true" />
                        Thống kê học tập
                    </h3>

                    <div className="flex items-center justify-center text-center py-6 text-sm text-slate-500">
                        Thống kê chi tiết (bài học, streak) sắp ra mắt.
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-card p-5 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
                    <Zap size={18} aria-hidden="true" />
                    Quick Actions
                </h3>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-dark transition-colors duration-200"
                    >
                        Tiếp tục học
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.COURSES)}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-cta text-white text-sm hover:bg-cta-dark transition-colors duration-200"
                    >
                        Khám phá khóa học
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.STUDENT.PROFILE)}
                        className="cursor-pointer px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-800 transition-colors duration-200"
                    >
                        Hồ sơ cá nhân
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
