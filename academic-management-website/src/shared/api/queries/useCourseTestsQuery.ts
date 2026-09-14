import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type CourseTestSummary = {
    courseId: number;
    courseTitle: string;
    quizId: number;
    quizTitle: string;
    attempted: boolean;
    bestScore: number | null;
};

export const courseTestsQueryKey = ["student", "courseTests"] as const;

export function useCourseTestsQuery() {
    return useQuery({
        queryKey: courseTestsQueryKey,
        queryFn: async (): Promise<CourseTestSummary[]> => {
            const res = await apiClient(API_ENDPOINTS.QUIZZES.COURSE_TESTS);

            if (!res.ok) {
                throw new Error(`Failed to load course tests (${res.status})`);
            }

            return res.json();
        },
    });
}
