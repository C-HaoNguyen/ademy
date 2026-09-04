import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type MyCourse = {
    courseId: number;
    title: string;
    thumbnail?: string;
    instructorName?: string;
    enrolledAt: string;
};

export const myCoursesQueryKey = ["student", "myCourses"] as const;

export function useMyCoursesQuery() {
    return useQuery({
        queryKey: myCoursesQueryKey,
        queryFn: async (): Promise<MyCourse[]> => {
            const res = await apiClient(API_ENDPOINTS.ENROLLMENTS.MY_COURSES);

            if (!res.ok) {
                throw new Error(`Failed to load my courses (${res.status})`);
            }

            return res.json();
        },
    });
}
