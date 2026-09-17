import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { getCheckoutSession, setCheckoutSession, clearCheckoutSession, resetForRetry } from "./checkoutSession";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import Button from "@/shared/ui/Button";
import Skeleton from "@/shared/ui/Skeleton";

type ResultState =
    | { kind: "loading" }
    | { kind: "success"; courseId?: number; courseTitle?: string; amount?: number }
    | { kind: "failure" }
    | { kind: "unknown" };

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "₫";

const CheckoutResult = () => {
    const { t } = useTranslation("courses");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [result, setResult] = useState<ResultState>({ kind: "loading" });

    // VNPay: FE nhận lại ?ref= sau khi backend tự verify+redirect (PaymentController.vnpayReturn).
    // Momo: redirect trực tiếp về FE, tự thêm ?orderId= (= transactionRef, PaymentController giữ
    // nguyên tên tham số của Momo). Stripe: FE tự nối ?ref= khi tạo checkout session (StripeGateway).
    const transactionRef = searchParams.get("ref") ?? searchParams.get("orderId");

    useEffect(() => {
        if (transactionRef) {
            apiClient(API_ENDPOINTS.PAYMENTS.STATUS(transactionRef))
                .then(async (res) => {
                    if (!res.ok) {
                        setResult({ kind: "unknown" });
                        return;
                    }
                    const data = await res.json();
                    // PaymentStatus (backend) serialize chữ THƯỜNG qua @JsonValue (payment/entity/
                    // PaymentStatus.java) — so sánh đúng case, không phải "SUCCESS"/"FAILED".
                    if (data.status === "success") {
                        setResult({ kind: "success", courseId: data.courseId, courseTitle: data.courseTitle, amount: data.amount });
                        clearCheckoutSession();
                    } else if (data.status === "failed") {
                        setResult({ kind: "failure" });
                        // Reset (không xóa hẳn) session để "Thử lại" có 1 Idempotency-Key mới thay vì
                        // replay đúng kết quả FAILED cũ (xem resetForRetry()).
                        const session = getCheckoutSession();
                        if (session) setCheckoutSession(resetForRetry(session));
                    } else {
                        // PENDING — gateway chưa xác nhận xong (webhook trễ) hoặc callback thất lạc.
                        // Chưa có kết luận gì để reset/xóa — giữ nguyên session.
                        setResult({ kind: "unknown" });
                    }
                })
                .catch(() => setResult({ kind: "unknown" }));
            return;
        }

        // Mock mode — kết quả đã biết ngay từ Bước 2, không cần gọi backend.
        const session = getCheckoutSession();
        if (session?.mockOutcome) {
            if (session.mockOutcome.success) {
                setResult({ kind: "success", courseId: session.courseId, courseTitle: session.courseTitle, amount: session.finalAmount });
                clearCheckoutSession();
            } else {
                setResult({ kind: "failure" });
                setCheckoutSession(resetForRetry(session));
            }
        } else {
            setResult({ kind: "unknown" });
        }
    }, [transactionRef]);

    if (result.kind === "loading") {
        return (
            <div className="bg-background">
                <div className="mx-auto max-w-md px-6 py-24 space-y-4 text-center">
                    <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                    <Skeleton className="h-6 w-2/3 mx-auto" />
                </div>
            </div>
        );
    }

    if (result.kind === "success") {
        return (
            <div className="bg-background">
                <div className="mx-auto max-w-md px-6 py-24 text-center space-y-4">
                    <CheckCircle2 size={48} className="mx-auto text-status-success-icon" aria-hidden="true" />
                    <h1 className="text-h2 text-primary">{t("checkoutResult.successTitle")}</h1>
                    {result.courseTitle && <p className="text-secondary">{result.courseTitle}</p>}
                    {typeof result.amount === "number" && (
                        <p className="text-body-lg font-semibold text-primary">{formatPrice(result.amount)}</p>
                    )}
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() =>
                            navigate(
                                result.courseId !== undefined
                                    ? ROUTES.STUDENT.LEARN(result.courseId)
                                    : ROUTES.STUDENT.MY_COURSES
                            )
                        }
                    >
                        {t("checkoutResult.goToLearning")}
                    </Button>
                </div>
            </div>
        );
    }

    if (result.kind === "failure") {
        return (
            <div className="bg-background">
                <div className="mx-auto max-w-md px-6 py-24 text-center space-y-4">
                    <XCircle size={48} className="mx-auto text-status-danger-icon" aria-hidden="true" />
                    <h1 className="text-h2 text-primary">{t("checkoutResult.failureTitle")}</h1>
                    <Button variant="secondary" size="lg" onClick={() => navigate(ROUTES.CHECKOUT_PAYMENT)}>
                        {t("checkoutResult.retry")}
                    </Button>
                </div>
            </div>
        );
    }

    // "unknown" — không xác định được trạng thái (timeout xác minh) — trung tính, không báo lỗi/thành
    // công sai (UI_SPEC §2.10 Error state).
    return (
        <div className="bg-background">
            <div className="mx-auto max-w-md px-6 py-24 text-center space-y-4">
                <Clock size={48} className="mx-auto text-status-info-icon" aria-hidden="true" />
                <h1 className="text-h2 text-primary">{t("checkoutResult.pendingTitle")}</h1>
                <p className="text-secondary">
                    {t("checkoutResult.pendingDescription")}
                </p>
                <Button variant="secondary" size="lg" onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}>
                    {t("checkoutResult.myCourses")}
                </Button>
            </div>
        </div>
    );
};

export default CheckoutResult;
