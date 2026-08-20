import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export const totalUsersQueryKey = ["admin", "stats", "totalUsers"] as const;
export const totalCoursesQueryKey = ["admin", "stats", "totalCourses"] as const;

async function fetchTotalUsers(): Promise<number> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.TOTAL_USERS);

    if (!res.ok) {
        throw new Error(`Failed to load total users (${res.status})`);
    }

    const data = await res.json();
    return data.totalUsers;
}

async function fetchTotalCourses(): Promise<number> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.TOTAL_COURSES);

    if (!res.ok) {
        throw new Error(`Failed to load total courses (${res.status})`);
    }

    const data = await res.json();
    return data.totalCourses;
}

// 2 query độc lập (giữ nguyên hành vi cũ: 1 request lỗi không kéo request kia lỗi theo)
export function useAdminStatsQuery() {
    const totalUsersQuery = useQuery({
        queryKey: totalUsersQueryKey,
        queryFn: fetchTotalUsers,
    });

    const totalCoursesQuery = useQuery({
        queryKey: totalCoursesQueryKey,
        queryFn: fetchTotalCourses,
    });

    return { totalUsersQuery, totalCoursesQuery };
}
