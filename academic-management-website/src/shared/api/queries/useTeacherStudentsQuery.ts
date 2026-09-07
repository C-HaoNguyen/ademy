import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type EnrolledStudent = {
    enrollmentId: number;
    studentUsername: string;
    studentFullName: string;
    enrolledAt: string;
};

export const teacherStudentsQueryKey = (courseId: number | string) =>
    ["teacher", "courses", courseId, "students"] as const;

export function useTeacherStudentsQuery(courseId: number | string | undefined) {
    return useQuery({
        queryKey: teacherStudentsQueryKey(courseId ?? "new"),
        enabled: courseId !== undefined,
        queryFn: async (): Promise<EnrolledStudent[]> => {
            const res = await apiClient(API_ENDPOINTS.TEACHER.STUDENTS(courseId as number | string));

            if (!res.ok) {
                throw new Error(`Failed to load enrolled students (${res.status})`);
            }

            return res.json();
        },
    });
}
