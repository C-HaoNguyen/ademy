import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type RawCourse = {
    courseId: number;
    title: string;
    description?: string;
    price?: number;
    thumbnail?: string;
    level?: string;
    instructor?: {
        username?: string;
        fullName?: string;
    };
    category?: {
        categoryId: number;
        categoryName?: string;
    };
};

export const coursesQueryKey = ["courses"] as const;

export function useCoursesQuery() {
    return useQuery({
        queryKey: coursesQueryKey,
        queryFn: async (): Promise<RawCourse[]> => {
            const res = await apiClient(API_ENDPOINTS.COURSES.LIST);

            if (!res.ok) {
                throw new Error(`Failed to load courses (${res.status})`);
            }

            return res.json();
        },
    });
}
