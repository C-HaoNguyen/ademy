// Badge tone/label + payment method label dùng chung giữa AdminOrders.tsx và PaymentDetailModal.tsx
// (tránh định nghĩa lặp lại ở cả 2 nơi). PaymentStatus thật chỉ có PENDING/SUCCESS/FAILED — hoàn
// tiền được theo dõi riêng ở refund_requests (ADR-010), không phải 1 giá trị của PaymentStatus.
export const PAYMENT_STATUS_TONE: Record<string, "success" | "warning" | "danger"> = {
    SUCCESS: "success",
    PENDING: "warning",
    FAILED: "danger",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
    SUCCESS: "Thành công",
    PENDING: "Đang xử lý",
    FAILED: "Thất bại",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
    vnpay: "VNPay",
    momo: "Momo",
    stripe: "Stripe",
};

export const formatCurrency = (amount: number) => Number(amount ?? 0).toLocaleString("vi-VN") + "₫";
