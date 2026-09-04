import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type QuizAttemptSummary = {
    attemptCount: number;
    averageScore: number | null;
};

export const totalCoursesQueryKey = ["student", "totalCourses"] as const;
export const quizAttemptSummaryQueryKey = ["student", "quizAttemptSummary"] as const;

export function useTotalCoursesQuery() {
    return useQuery({
        queryKey: totalCoursesQueryKey,
        queryFn: async (): Promise<number> => {
            const res = await apiClient(API_ENDPOINTS.ENROLLMENTS.MY_SUMMARY);

            if (!res.ok) {
                throw new Error(`Failed to load student summary (${res.status})`);
            }

            const data = await res.json();
            return data.totalCourses;
        },
    });
}

export function useQuizAttemptSummaryQuery() {
    return useQuery({
        queryKey: quizAttemptSummaryQueryKey,
        queryFn: async (): Promise<QuizAttemptSummary> => {
            const res = await apiClient(API_ENDPOINTS.QUIZ_ATTEMPTS.MY_SUMMARY);

            if (!res.ok) {
                throw new Error(`Failed to load quiz attempt summary (${res.status})`);
            }

            return res.json();
        },
    });
}
