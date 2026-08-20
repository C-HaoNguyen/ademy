import {
    Users,
    GraduationCap,
    ShoppingCart,
    DollarSign,
    Activity,
    BookOpen,
    UserCheck,
    Zap,
    BarChart3,
} from "lucide-react";
import { useAdminStatsQuery } from "@/shared/api/queries/useAdminStatsQuery";

const StatCard = ({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}) => (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                    {value}
                </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                {icon}
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {

    const { totalUsersQuery, totalCoursesQuery } = useAdminStatsQuery();
    const totalUsers = totalUsersQuery.data ?? 0;
    const totalCourses = totalCoursesQuery.data ?? 0;

    return (
        <div className="space-y-8">
            {/* Title */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                    Admin Dashboard
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Overview of system statistics & recent activities
                </p>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Users size={22} />}
                    label="Tổng số người dùng"
                    value={totalUsers}
                />
                <StatCard
                    icon={<GraduationCap size={22} />}
                    label="Tổng số khóa học"
                    value={totalCourses}
                />
                <StatCard
                    icon={<ShoppingCart size={22} />}
                    label="Số lượng đơn mua"
                    value={560}
                />
                <StatCard
                    icon={<DollarSign size={22} />}
                    label="Tổng doanh thu"
                    value="12.545.740 đ"
                />
            </div>

            {/* Middle section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course status */}
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <BookOpen size={18} />
                        Course Status
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between">
                            <span className="text-gray-600">Active courses</span>
                            <span className="font-medium text-green-600">
                                28
                            </span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">Draft courses</span>
                            <span className="font-medium text-yellow-600">
                                5
                            </span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">
                                Disabled courses
                            </span>
                            <span className="font-medium text-red-600">
                                2
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Instructors */}
                <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <UserCheck size={18} />
                        Instructors
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between">
                            <span className="text-gray-600">
                                Total instructors
                            </span>
                            <span className="font-medium">8</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">
                                Max courses / instructor
                            </span>
                            <span className="font-medium">7</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-gray-600">
                                New this month
                            </span>
                            <span className="font-medium text-blue-600">
                                2
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Recent activities */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity size={18} />
                    Recent Activities
                </h3>
                <ul className="text-sm space-y-3">
                    <li>➕ New user registered: <b>john_doe</b></li>
                    <li>🎓 New course created: <b>React for Beginners</b></li>
                    <li>💳 New order placed: <b>#ORD-1024</b></li>
                    <li>✏️ Course updated: <b>Java Spring Boot</b></li>
                </ul>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Zap size={18} />
                    Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition">
                        Add User
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition">
                        Create Course
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition">
                        Manage Categories
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm hover:bg-gray-800 transition">
                        View Reports
                    </button>
                </div>
            </div>

            {/* Chart placeholder */}
            <div className="bg-white rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-gray-400">
                <BarChart3 size={32} />
                <p className="mt-2 text-sm">
                    Revenue & User Growth Chart (Coming soon)
                </p>
            </div>
        </div>
    );
};

export default AdminDashboard;
