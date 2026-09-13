// Badge tone/label + payment method label dùng chung giữa AdminOrders.tsx và PaymentDetailModal.tsx
// (tránh định nghĩa lặp lại ở cả 2 nơi). PaymentStatus thật chỉ có PENDING/SUCCESS/FAILED — hoàn
// tiền được theo dõi riêng ở refund_requests (ADR-010), không phải 1 giá trị của PaymentStatus.
//
// Lưu ý case-sensitivity: `Payments.status` (backend) là enum `PaymentStatus` với @JsonValue trả về
// chữ THƯỜNG (payment/entity/PaymentStatus.java) nhưng `Payments.paymentMethod` là String thô ghi
// bằng `PaymentMethod.name()` nên lại là chữ HOA (payment/service/PaymentService.java buildPayment()).
// 2 field này lệch case nhau ở phía backend — 2 map dưới đây và các hàm get*() chuẩn hóa về đúng 1
// case (.toUpperCase()) trước khi tra cứu, để không phụ thuộc vào việc backend trả hoa hay thường.
const PAYMENT_STATUS_TONE: Record<string, "success" | "warning" | "danger"> = {
    SUCCESS: "success",
    PENDING: "warning",
    FAILED: "danger",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
    SUCCESS: "Thành công",
    PENDING: "Đang xử lý",
    FAILED: "Thất bại",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
    VNPAY: "VNPay",
    MOMO: "Momo",
    STRIPE: "Stripe",
};

export const getPaymentStatusTone = (status: string | null | undefined): "success" | "warning" | "danger" | "info" =>
    PAYMENT_STATUS_TONE[status?.toUpperCase() ?? ""] ?? "info";

export const getPaymentStatusLabel = (status: string | null | undefined): string =>
    PAYMENT_STATUS_LABEL[status?.toUpperCase() ?? ""] ?? status ?? "—";

export const getPaymentMethodLabel = (method: string | null | undefined): string =>
    PAYMENT_METHOD_LABEL[method?.toUpperCase() ?? ""] ?? method ?? "—";

export const formatCurrency = (amount: number) => Number(amount ?? 0).toLocaleString("vi-VN") + "₫";
