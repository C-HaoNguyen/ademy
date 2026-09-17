import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import OrderSummaryCard from "./components/OrderSummaryCard";
import { getCheckoutSession, setCheckoutSession, type CheckoutSession } from "./checkoutSession";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useToast } from "@/shared/ui/useToast";
import Button from "@/shared/ui/Button";
import RadioCardGroup, { type RadioCardOption } from "@/shared/ui/RadioCardGroup";

const GATEWAY_OPTIONS: RadioCardOption[] = [
    { value: "vnpay", label: "VNPay" },
    { value: "momo", label: "Momo" },
    { value: "stripe", label: "Stripe" },
];

const CheckoutPayment = () => {
    const { t } = useTranslation("courses");
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [session, setSession] = useState<CheckoutSession | null>(null);
    const [gateway, setGateway] = useState<string>("vnpay");
    const [submitting, setSubmitting] = useState(false);

    // Đọc session từ Bước 1 — nếu thiếu (vào thẳng URL, hoặc sessionStorage đã bị xóa/hết phiên),
    // quay lại Bước 1 thay vì crash (UI_SPEC §2.9 "chưa có session checkout hợp lệ, redirect lại Bước 1").
    useEffect(() => {
        const existing = getCheckoutSession();
        if (!existing) {
            navigate(ROUTES.CHECKOUT, { replace: true });
            return;
        }
        setSession(existing);
    }, [navigate]);

    const handleConfirm = async () => {
        if (!session) return;

        // Idempotency-Key (ADR-007) sinh 1 lần cho cả phiên Bước 2 — dùng lại cho mọi lần bấm
        // "Xác nhận thanh toán" tiếp theo (đổi gateway/retry sau lỗi) thay vì sinh mới mỗi lần.
        const idempotencyKey = session.idempotencyKey ?? crypto.randomUUID();
        if (!session.idempotencyKey) {
            setCheckoutSession({ ...session, idempotencyKey });
            setSession({ ...session, idempotencyKey });
        }

        setSubmitting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.PAYMENTS.CHECKOUT, {
                method: "POST",
                headers: { "Idempotency-Key": idempotencyKey },
                body: JSON.stringify({
                    courseId: session.courseId,
                    paymentMethod: gateway,
                    couponCode: session.couponCode,
                }),
            });

            const data = await res.json().catch(() => null);

            // `PaymentResponse{success,message}` (kể cả case "đã đăng ký khóa học này", HTTP 400) luôn
            // có field `success` kiểu boolean — phân biệt được với lỗi thật (`ErrorResponse` từ
            // GlobalExceptionHandler, ví dụ thiếu Idempotency-Key/validate lỗi) không có field này.
            if (!res.ok && (!data || typeof data.success !== "boolean")) {
                showToast({
                    tone: "danger",
                    message: data?.message ?? t("checkoutPayment.initFailed"),
                });
                return;
            }

            if (data.redirectUrl) {
                // Live mode (Phase 21) — rời SPA thật, VNPay/Momo/Stripe sẽ đưa trình duyệt quay lại
                // /checkout/result sau khi xử lý xong (xem cấu hình return/redirect URL của từng gateway).
                window.location.href = data.redirectUrl;
                return;
            }

            // Mock mode — kết quả đã biết ngay, không cần gọi lại /payments/status ở Bước 3.
            setCheckoutSession({ ...session, idempotencyKey, mockOutcome: { success: data.success, message: data.message } });
            navigate(ROUTES.CHECKOUT_RESULT);
        } catch (err) {
            console.error("Checkout failed", err);
            showToast({ tone: "danger", message: t("checkoutPayment.initFailed") });
        } finally {
            setSubmitting(false);
        }
    };

    if (!session) {
        return null;
    }

    return (
        <div className="bg-background">
            <div className="mx-auto max-w-3xl px-6 py-16 space-y-6">
                <h1 className="text-h2 text-primary">{t("checkoutPayment.title")}</h1>

                <OrderSummaryCard
                    compact
                    title={session.courseTitle}
                    instructor={session.instructorName}
                    price={session.price}
                    discount={session.discountAmount}
                />

                <RadioCardGroup
                    name="payment-method"
                    options={GATEWAY_OPTIONS}
                    value={gateway}
                    onChange={setGateway}
                    disabled={submitting}
                />

                <div className="flex flex-col gap-3">
                    <Button variant="cta" size="lg" loading={submitting} onClick={handleConfirm}>
                        {t("checkoutPayment.confirm")}
                    </Button>
                    <Link to={ROUTES.CHECKOUT} className="text-center text-body-sm text-tertiary hover:text-primary">
                        {t("checkoutPayment.back")}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPayment;
