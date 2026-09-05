import { Users, GraduationCap, BookOpen, DollarSign, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/constants";
import {
    useTotalStudentsQuery,
    useTotalCoursesQuery,
    useTotalTeachersQuery,
    useTotalRevenueQuery,
    useRecentPendingRefundsQuery,
    useRecentlyPublishedCoursesQuery,
} from "@/shared/api/queries/useAdminStatsQuery";
import Card from "@/shared/ui/Card";
import StatCard from "@/shared/ui/StatCard";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import { SkeletonText } from "@/shared/ui/Skeleton";

const formatCurrency = (amount: number) => Number(amount ?? 0).toLocaleString("vi-VN") + "₫";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const totalStudentsQuery = useTotalStudentsQuery();
    const totalCoursesQuery = useTotalCoursesQuery();
    const totalTeachersQuery = useTotalTeachersQuery();
    const totalRevenueQuery = useTotalRevenueQuery();
    const recentPendingRefundsQuery = useRecentPendingRefundsQuery();
    const recentlyPublishedCoursesQuery = useRecentlyPublishedCoursesQuery();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-h2 text-primary">Admin Dashboard</h2>
                <p className="text-body-sm text-secondary mt-1">
                    Tổng quan vận hành toàn nền tảng
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<DollarSign size={22} aria-hidden="true" />}
                    label="Tổng doanh thu"
                    value={totalRevenueQuery.isError ? "—" : formatCurrency(totalRevenueQuery.data ?? 0)}
                    loading={totalRevenueQuery.isLoading}
                />
                <StatCard
                    icon={<Users size={22} aria-hidden="true" />}
                    label="Tổng số học viên"
                    value={totalStudentsQuery.isError ? "—" : (totalStudentsQuery.data ?? 0)}
                    loading={totalStudentsQuery.isLoading}
                />
                <StatCard
                    icon={<BookOpen size={22} aria-hidden="true" />}
                    label="Tổng số khóa học"
                    value={totalCoursesQuery.isError ? "—" : (totalCoursesQuery.data ?? 0)}
                    loading={totalCoursesQuery.isLoading}
                />
                <StatCard
                    icon={<GraduationCap size={22} aria-hidden="true" />}
                    label="Tổng số Giảng viên"
                    value={totalTeachersQuery.isError ? "—" : (totalTeachersQuery.data ?? 0)}
                    loading={totalTeachersQuery.isLoading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card variant="app">
                    <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                        <RefreshCcw size={18} aria-hidden="true" />
                        Yêu cầu hoàn tiền đang chờ duyệt
                    </h3>

                    {recentPendingRefundsQuery.isLoading ? (
                        <SkeletonText lines={3} />
                    ) : recentPendingRefundsQuery.isError ? (
                        <p className="text-body-sm text-secondary">—</p>
                    ) : (recentPendingRefundsQuery.data ?? []).length === 0 ? (
                        <EmptyState icon={RefreshCcw} title="Không có yêu cầu nào đang chờ" />
                    ) : (
                        <ul className="space-y-3">
                            {(recentPendingRefundsQuery.data ?? []).map((refund) => (
                                <li
                                    key={refund.id}
                                    className="flex items-center justify-between gap-4 rounded-radius-md border border-default p-3"
                                >
                                    <div className="min-w-0">
                                        <p className="text-body font-medium text-primary truncate">
                                            {refund.courseTitle}
                                        </p>
                                        <p className="text-body-sm text-secondary truncate">
                                            {new Date(refund.requestedAt).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                    <span className="text-body-sm font-medium text-primary shrink-0">
                                        {formatCurrency(refund.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card variant="app">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-primary flex items-center gap-2">
                            <BookOpen size={18} aria-hidden="true" />
                            Khóa học mới publish gần đây
                        </h3>
                        <Button variant="tertiary" size="sm" onClick={() => navigate(ROUTES.ADMIN.COURSES)}>
                            Xem tất cả
                        </Button>
                    </div>

                    {recentlyPublishedCoursesQuery.isLoading ? (
                        <SkeletonText lines={3} />
                    ) : recentlyPublishedCoursesQuery.isError ? (
                        <p className="text-body-sm text-secondary">—</p>
                    ) : (recentlyPublishedCoursesQuery.data ?? []).length === 0 ? (
                        <EmptyState icon={BookOpen} title="Chưa có khóa học nào được publish" />
                    ) : (
                        <ul className="space-y-3">
                            {(recentlyPublishedCoursesQuery.data ?? []).map((course) => (
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
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
