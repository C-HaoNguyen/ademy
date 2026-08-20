import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type AdminCategory = {
    categoryId: number;
    categoryName: string;
    description: string | null;
};

export const adminCategoriesQueryKey = ["admin", "categories"] as const;

export function useAdminCategoriesQuery() {
    return useQuery({
        queryKey: adminCategoriesQueryKey,
        queryFn: async (): Promise<AdminCategory[]> => {
            const res = await apiClient(API_ENDPOINTS.CATEGORIES.ADMIN_LIST);

            if (!res.ok) {
                throw new Error(`Failed to load admin categories (${res.status})`);
            }

            return res.json();
        },
    });
}
