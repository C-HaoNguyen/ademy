import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type AdminUser = {
    userId: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
};

export const adminUsersQueryKey = ["admin", "users"] as const;

export function useAdminUsersQuery() {
    return useQuery({
        queryKey: adminUsersQueryKey,
        queryFn: async (): Promise<AdminUser[]> => {
            const res = await apiClient(API_ENDPOINTS.USERS.LIST);

            if (!res.ok) {
                throw new Error(`Failed to load admin users (${res.status})`);
            }

            return res.json();
        },
    });
}
