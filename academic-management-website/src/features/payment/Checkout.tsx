import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentForm from "./components/PaymentForm";
import OrderSummary from "./components/OrderSummary";
import PaymentSuccessOverlay from "./components/EnrollSuccessOverlay";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import Skeleton from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import Toast from "@/shared/ui/Toast";
import { ShoppingCart } from "lucide-react";

type CourseDetail = {
    courseId: number;
    title: string;
    price: number;
    thumbnail?: string;
    instructor: {
        fullName: string;
    };
};

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const courseId = location.state?.courseId;

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [coupon, setCoupon] = useState("");
    const [couponError, setCouponError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        apiClient(API_ENDPOINTS.COURSES.DETAIL(courseId))
            .then(res => {
                if (!res.ok) throw new Error("Course not found");
                return res.json();
            })
            .then(setCourse)
            .catch((err) => {
                console.error("Failed to load course for checkout", err);
                setCourse(null);
            })
            .finally(() => setLoading(false));
    }, [courseId]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    const applyCoupon = () => {
        // mock logic – sau này gọi API
        if (coupon === "GIAM50") {
            setDiscount(50000);
            setCouponError(null);
        } else if (coupon === "FREE100") {
            setDiscount(course ? course.price : 0);
            setCouponError(null);
        } else {
            setDiscount(0);
            setCouponError("Mã giảm giá không hợp lệ");
        }
    };

    const handlePayment = async () => {
        if (!course) return;

        try {
            const res = await apiClient(API_ENDPOINTS.ENROLLMENTS.CREATE, {
                method: "POST",
                body: JSON.stringify({
                    courseId: course.courseId,
                    pricePaid: Math.max(course.price - discount, 0),
                    couponCode: coupon || null
                })
            });

            if (!res.ok) {
                throw new Error("Payment failed");
            }

            setSuccess(true);
        } catch (err) {
            console.error(err);
            setToast({ message: "Thanh toán thất bại. Vui lòng thử lại.", type: "error" });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-legacy-surface px-6 py-12">
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-card bg-white p-6 shadow-sm border border-slate-100 space-y-4">
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                    <div className="rounded-card bg-white p-6 shadow-sm border border-slate-100 space-y-4">
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!courseId || !course) {
        return (
            <div className="min-h-screen bg-legacy-surface px-6 py-20">
                <div className="max-w-md mx-auto">
                    <EmptyState
                        icon={ShoppingCart}
                        title="Không có khóa học để thanh toán"
                        description="Vui lòng chọn một khóa học trước khi tiến hành thanh toán."
                        action={
                            <button
                                type="button"
                                onClick={() => navigate("/courses")}
                                className="cursor-pointer px-5 py-2 rounded-xl bg-legacy-primary text-white text-sm font-medium hover:bg-legacy-primary-dark transition-colors duration-200"
                            >
                                Xem danh sách khóa học
                            </button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-legacy-surface px-6 py-12">
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <PaymentForm onSubmit={handlePayment} />
                </div>

                <OrderSummary
                    title={course.title}
                    instructor={course.instructor.fullName}
                    thumbnail={course.thumbnail}
                    price={course.price}
                    discount={discount}
                    enableCoupon={true}
                    coupon={coupon}
                    couponError={couponError}
                    onCouponChange={(v) => {
                        setCoupon(v);
                        setCouponError(null);
                    }}
                    onApplyCoupon={applyCoupon}
                />
            </div>

            <PaymentSuccessOverlay
                open={success}
                onClose={() => setSuccess(false)}
            />

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default Checkout;
