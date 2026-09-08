import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type AdminCourse = {
    courseId: number;
    title: string;
    status: string;
    instructorFullName: string;
    studentCount: number;
    publishedAt: string | null;
    // Không hiển thị ở bảng AdminCourses (UI_SPEC §5.3) — giữ lại vì AdminCategories.tsx dùng field
    // này để đếm "Số khóa học" theo danh mục.
    categoryId: number | null;
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
