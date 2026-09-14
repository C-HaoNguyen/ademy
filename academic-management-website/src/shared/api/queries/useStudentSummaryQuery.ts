import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type QuizAttemptSummary = {
    attemptCount: number;
    averageScore: number | null;
};

export type StudentDashboardSummary = {
    totalCourses: number;
    // Phase 35 — trung bình % hoàn thành lesson trên các course đã mua có ít nhất 1 lesson; null
    // nếu chưa course nào đủ điều kiện tính (chưa có lesson nào).
    averageProgressPercent: number | null;
};

export const studentDashboardSummaryQueryKey = ["student", "dashboardSummary"] as const;
export const quizAttemptSummaryQueryKey = ["student", "quizAttemptSummary"] as const;

export function useStudentDashboardSummaryQuery() {
    return useQuery({
        queryKey: studentDashboardSummaryQueryKey,
        queryFn: async (): Promise<StudentDashboardSummary> => {
            const res = await apiClient(API_ENDPOINTS.ENROLLMENTS.MY_SUMMARY);

            if (!res.ok) {
                throw new Error(`Failed to load student summary (${res.status})`);
            }

            return res.json();
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
