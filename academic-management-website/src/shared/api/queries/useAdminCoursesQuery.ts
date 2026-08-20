import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type AdminCourse = {
    courseId: number;
    title: string;
    description: string | null;
    thumbnail: string | null;
    price: number;
    level: string;
    status: string;
    createdAt: string;
    updatedAt: string;

    instructor: {
        userId: number;
        username: string;
        fullName: string;
    };

    category: {
        categoryId: number;
        categoryName: string;
    } | null;
};

export const adminCoursesQueryKey = ["admin", "courses"] as const;

export function useAdminCoursesQuery() {
    return useQuery({
        queryKey: adminCoursesQueryKey,
        queryFn: async (): Promise<AdminCourse[]> => {
            const res = await apiClient(API_ENDPOINTS.COURSES.ADMIN_LIST);

            if (!res.ok) {
                throw new Error(`Failed to load admin courses (${res.status})`);
            }

            return res.json();
        },
    });
}
