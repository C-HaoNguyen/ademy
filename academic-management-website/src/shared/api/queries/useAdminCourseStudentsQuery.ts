import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type AdminEnrolledStudent = {
    enrollmentId: number;
    studentUsername: string;
    studentFullName: string;
    enrolledAt: string;
    accessRevokedAt: string | null;
};

export const adminCourseStudentsQueryKey = (courseId: number | string) =>
    ["admin", "courses", courseId, "students"] as const;

export function useAdminCourseStudentsQuery(courseId: number | string | undefined) {
    return useQuery({
        queryKey: adminCourseStudentsQueryKey(courseId ?? "none"),
        enabled: courseId !== undefined,
        queryFn: async (): Promise<AdminEnrolledStudent[]> => {
            const res = await apiClient(API_ENDPOINTS.COURSES.ADMIN_STUDENTS(courseId as number | string));

            if (!res.ok) {
                throw new Error(`Failed to load course students (${res.status})`);
            }

            return res.json();
        },
    });
}
