// Checkout 3 bước (Phase 33, UI_SPEC §2.8-2.10) — state cần chia sẻ giữa Bước 1/2/3 nhưng phải
// sống sót qua việc gateway thật (VNPay/Momo/Stripe) đưa trình duyệt rời khỏi SPA rồi quay lại, nên
// không thể dùng React state/context — lưu ở sessionStorage (không cần bền vững qua nhiều phiên
// trình duyệt khác nhau như localStorage, chỉ cần sống trong 1 lần thanh toán).
const STORAGE_KEY = "checkout-session";

export interface CheckoutSession {
    courseId: number;
    courseTitle: string;
    courseThumbnail?: string;
    instructorName: string;
    price: number;
    couponCode: string | null;
    discountAmount: number;
    finalAmount: number;
    // Sinh 1 lần khi vào Bước 2, dùng lại cho mọi lần bấm "Xác nhận thanh toán" trong cùng phiên
    // (đổi gateway/retry sau lỗi transient không sinh key mới) — UI_SPEC §2.9, ADR-007.
    idempotencyKey?: string;
    // Chỉ có ở mock mode — checkout() trả kết quả ngay, không cần gọi lại /payments/status.
    mockOutcome?: { success: boolean; message: string };
}

export function getCheckoutSession(): CheckoutSession | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as CheckoutSession) : null;
    } catch {
        return null;
    }
}

export function setCheckoutSession(session: CheckoutSession): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearCheckoutSession(): void {
    sessionStorage.removeItem(STORAGE_KEY);
}

// Sau khi 1 attempt thất bại (FAILED thật, không phải "đã đăng ký"/coupon lỗi ở Bước 1), nút "Thử
// lại" cần 1 attempt MỚI — không được dùng lại idempotencyKey cũ, vì key đó đã gắn với 1 `Payments`
// row có status=FAILED trong DB: PaymentService.resolveLiveCheckoutConflict()/toReplayResponse() sẽ
// chỉ replay đúng kết quả FAILED cũ, không bao giờ gọi lại gateway (ADR-007 — key gắn với 1 attempt).
// Giữ nguyên courseId/coupon/giá đã tính ở Bước 1 để không bắt Student nhập lại từ đầu.
export function resetForRetry(session: CheckoutSession): CheckoutSession {
    const { idempotencyKey, mockOutcome, ...rest } = session;
    void idempotencyKey;
    void mockOutcome;
    return rest;
}
