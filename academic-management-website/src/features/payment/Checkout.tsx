import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OrderSummaryCard from "./components/OrderSummaryCard";
import { getCheckoutSession, setCheckoutSession } from "./checkoutSession";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useToast } from "@/shared/ui/useToast";
import Skeleton from "@/shared/ui/Skeleton";
import EmptyState from "@/shared/ui/EmptyState";
import Button from "@/shared/ui/Button";
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
    const { t } = useTranslation("courses");
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    // Fallback sang session đã lưu ở lần "Tiếp tục" trước đó — cần cho link "Quay lại" ở Bước 2
    // (điều hướng bằng <Link>, không mang router state) và cả trường hợp back button/reload làm mất
    // location.state, để không hiện nhầm Empty State "Không có khóa học" khi thực ra vẫn đang có đơn
    // hàng dở dang.
    const courseId = location.state?.courseId ?? getCheckoutSession()?.courseId;

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponLoading, setCouponLoading] = useState(false);
    const [continuing, setContinuing] = useState(false);

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        apiClient(API_ENDPOINTS.COURSES.DETAIL(courseId))
            .then((res) => {
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

    const applyCoupon = async () => {
        if (!course || !coupon.trim()) return;

        setCouponLoading(true);
        setCouponError(null);
        try {
            const res = await apiClient(API_ENDPOINTS.PAYMENTS.VALIDATE_COUPON, {
                method: "POST",
                body: JSON.stringify({ courseId: course.courseId, couponCode: coupon.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                setCouponApplied(false);
                setDiscount(0);
                setCouponError(data.message || t("checkout.invalidCoupon"));
                return;
            }

            setDiscount(data.discountAmount);
            setCouponApplied(true);
        } catch (err) {
            console.error("Failed to validate coupon", err);
            setCouponApplied(false);
            setDiscount(0);
            setCouponError(t("checkout.couponApplyFailed"));
        } finally {
            setCouponLoading(false);
        }
    };

    const handleContinue = () => {
        if (!course) return;

        setContinuing(true);
        setCheckoutSession({
            courseId: course.courseId,
            courseTitle: course.title,
            courseThumbnail: course.thumbnail,
            instructorName: course.instructor.fullName,
            price: course.price,
            couponCode: couponApplied ? coupon.trim() : null,
            discountAmount: couponApplied ? discount : 0,
            finalAmount: Math.max(course.price - (couponApplied ? discount : 0), 0),
        });
        navigate(ROUTES.CHECKOUT_PAYMENT);
    };

    if (loading) {
        return (
            <div className="bg-background">
                <div className="mx-auto max-w-3xl px-6 py-16 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-40 w-full rounded-radius-lg" />
                    <Skeleton className="h-12 w-full rounded-radius-md" />
                </div>
            </div>
        );
    }

    if (!courseId || !course) {
        return (
            <div className="bg-background">
                <div className="mx-auto max-w-md px-6 py-20">
                    <EmptyState
                        icon={ShoppingCart}
                        title={t("checkout.emptyTitle")}
                        description={t("checkout.emptyDescription")}
                        action={
                            <Button variant="cta" onClick={() => navigate(ROUTES.COURSES)}>
                                {t("checkout.viewCourses")}
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background">
            <div className="mx-auto max-w-3xl px-6 py-16 space-y-6">
                <h1 className="text-h2 text-primary">{t("checkout.title")}</h1>

                <OrderSummaryCard
                    title={course.title}
                    instructor={course.instructor.fullName}
                    thumbnail={course.thumbnail}
                    price={course.price}
                    discount={discount}
                    couponCode={coupon}
                    couponError={couponError}
                    couponApplied={couponApplied}
                    couponLoading={couponLoading}
                    onCouponChange={(v) => {
                        setCoupon(v);
                        setCouponError(null);
                        setCouponApplied(false);
                        setDiscount(0);
                    }}
                    onApplyCoupon={() => {
                        applyCoupon().catch(() => {
                            showToast({ tone: "danger", message: t("checkout.couponApplyFailedToast") });
                        });
                    }}
                />

                <div className="sticky bottom-0 -mx-6 bg-background/95 px-6 py-4 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
                    <Button variant="cta" size="lg" className="w-full" loading={continuing} onClick={handleContinue}>
                        {t("checkout.continue")}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
