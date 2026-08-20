import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type RawCategory = {
    categoryId: number;
    categoryName?: string;
    description?: string | null;
};

export const categoriesQueryKey = ["categories"] as const;

export function useCategoriesQuery() {
    return useQuery({
        queryKey: categoriesQueryKey,
        queryFn: async (): Promise<RawCategory[]> => {
            const res = await apiClient(API_ENDPOINTS.CATEGORIES.LIST);

            if (!res.ok) {
                throw new Error(`Failed to load categories (${res.status})`);
            }

            return res.json();
        },
    });
}
