import { useEffect, useMemo, useState } from "react";
import { Receipt, ReceiptText } from "lucide-react";
import { getAccessToken } from "../../../utils/AuthUtils";
import { API_URL } from "@/config/constants";
import { SkeletonTable } from "@/components/common/Skeleton";
import EmptyState from "@/components/common/EmptyState";

type Payment = {
    paymentId: number;
    student: {
        userId: number;
        fullName: string;
        username: string;
    } | null;
    course: {
        courseId: number;
        title: string;
    } | null;
    amount: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
};

const statusStyle = (status: string) => {
    const normalized = status?.toUpperCase();
    if (normalized === "SUCCESS") return "bg-success-light text-success";
    if (normalized === "FAILED") return "bg-danger-light text-danger";
    return "bg-warning-light text-warning";
};

const statusLabel = (status: string) => {
    const normalized = status?.toUpperCase();
    if (normalized === "SUCCESS") return "Thành công";
    if (normalized === "FAILED") return "Thất bại";
    return "Đang xử lý";
};

const formatCurrency = (amount: number) =>
    Number(amount ?? 0).toLocaleString("vi-VN") + "₫";

const AdminOrders = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending" | "failed">("all");

    useEffect(() => {
        refreshPayments();
    }, []);

    async function refreshPayments() {
        setLoading(true);
        try {
            const token = getAccessToken();
            const res = await fetch(`${API_URL}/admin/payments`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                console.error("API error:", res.status);
                return;
            }

            const data = await res.json();
            setPayments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const filteredPayments = useMemo(() => {
        if (statusFilter === "all") return payments;
        return payments.filter((p) => p.status?.toUpperCase() === statusFilter.toUpperCase());
    }, [payments, statusFilter]);

    const totalRevenue = useMemo(
        () =>
            payments
                .filter((p) => p.status?.toUpperCase() === "SUCCESS")
                .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),
        [payments]
    );

    return (
        <div>
            <h2 className="flex items-center text-2xl text-primary font-semibold mb-4 gap-3">
                <Receipt size={24} aria-hidden="true" />
                Quản lý đơn thanh toán
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-card p-5 shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500">Tổng số đơn</p>
                    <p className="text-2xl font-bold text-ink mt-1">{payments.length}</p>
                </div>
                <div className="bg-white rounded-card p-5 shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500">Đơn thành công</p>
                    <p className="text-2xl font-bold text-success mt-1">
                        {payments.filter((p) => p.status?.toUpperCase() === "SUCCESS").length}
                    </p>
                </div>
                <div className="bg-white rounded-card p-5 shadow-sm border border-slate-100">
                    <p className="text-sm text-slate-500">Doanh thu</p>
                    <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                {(["all", "success", "pending", "failed"] as const).map((status) => (
                    <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${statusFilter === status
                            ? "bg-primary text-white"
                            : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        {status === "all"
                            ? "Tất cả"
                            : status === "success"
                                ? "Thành công"
                                : status === "pending"
                                    ? "Đang xử lý"
                                    : "Thất bại"}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-card shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-sm">
                        <colgroup>
                            <col className="w-16" />
                            <col className="w-48" />
                            <col className="w-auto" />
                            <col className="w-32" />
                            <col className="w-32" />
                            <col className="w-28" />
                            <col className="w-40" />
                        </colgroup>

                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-center text-slate-600">
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Học viên</th>
                                <th className="px-4 py-3 font-medium">Khóa học</th>
                                <th className="px-4 py-3 font-medium">Số tiền</th>
                                <th className="px-4 py-3 font-medium">Phương thức</th>
                                <th className="px-4 py-3 font-medium">Trạng thái</th>
                                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <SkeletonTable rows={6} columns={7} />
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr
                                        key={payment.paymentId}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                                    >
                                        <td className="text-center px-4 py-3">{payment.paymentId}</td>
                                        <td className="text-center px-4 py-3 truncate">
                                            {payment.student?.fullName ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 truncate text-center">
                                            {payment.course?.title ?? "—"}
                                        </td>
                                        <td className="text-center px-4 py-3 font-medium text-ink">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="text-center px-4 py-3 text-slate-600">
                                            {payment.paymentMethod ?? "—"}
                                        </td>
                                        <td className="text-center px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle(payment.status)}`}>
                                                {statusLabel(payment.status)}
                                            </span>
                                        </td>
                                        <td className="text-center px-4 py-3 text-slate-500">
                                            {payment.createdAt}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {!loading && filteredPayments.length === 0 && (
                        <div className="p-8">
                            <EmptyState
                                icon={ReceiptText}
                                title="Chưa có đơn thanh toán nào"
                                description="Các đơn thanh toán từ học viên sẽ xuất hiện tại đây."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrders;
