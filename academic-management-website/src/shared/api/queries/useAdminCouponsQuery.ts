import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type CouponDiscountType = "PERCENTAGE" | "FIXED";

export type AdminCoupon = {
    id: number;
    code: string;
    discountType: CouponDiscountType;
    discountValue: number;
    courseId: number | null;
    courseTitle: string | null;
    maxRedemptions: number | null;
    redemptionCount: number;
    expiresAt: string | null;
    active: boolean;
    createdAt: string;
};

export const adminCouponsQueryKey = ["admin", "coupons"] as const;

// Backend serialize CouponDiscountType bằng @JsonValue name().toLowerCase() (payment/coupon/entity/
// CouponDiscountType.java) nên response thật là "percentage"/"fixed" chữ thường, lệch với tên hằng
// số enum — cùng kiểu lệch case đã ghi chú ở paymentStatus.ts. Chuẩn hóa về chữ HOA ngay tại query
// hook (không phải ở usage site) vì field này có type union hẹp ("PERCENTAGE"|"FIXED"), không phải
// string tự do — để type luôn khớp giá trị thật.
export function useAdminCouponsQuery() {
    return useQuery({
        queryKey: adminCouponsQueryKey,
        queryFn: async (): Promise<AdminCoupon[]> => {
            const res = await apiClient(API_ENDPOINTS.COUPONS.ADMIN_LIST);

            if (!res.ok) {
                throw new Error(`Failed to load admin coupons (${res.status})`);
            }

            const data = (await res.json()) as AdminCoupon[];
            return data.map((coupon) => ({
                ...coupon,
                discountType: coupon.discountType.toUpperCase() as CouponDiscountType,
            }));
        },
    });
}
