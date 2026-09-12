import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type AdminPayment = {
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

export const adminPaymentsQueryKey = ["admin", "payments"] as const;

export function useAdminPaymentsQuery() {
    return useQuery({
        queryKey: adminPaymentsQueryKey,
        queryFn: async (): Promise<AdminPayment[]> => {
            const res = await apiClient(API_ENDPOINTS.ADMIN.PAYMENTS);

            if (!res.ok) {
                throw new Error(`Failed to load admin payments (${res.status})`);
            }

            return res.json();
        },
    });
}
