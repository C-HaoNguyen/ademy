import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import type { StudentQuiz } from "@/shared/api/queries/useCourseQuizQuery";

export const lessonQuizQueryKey = (lessonId: number | string) =>
    ["student", "lessonQuiz", lessonId] as const;

// Phase 35 — quiz nhúng trong Lesson Player khi lesson.contentType === "quiz" (khác
// useCourseQuizQuery dùng cho Test Practice — biến thể lesson-level, backend đã có từ Phase 24).
export function useLessonQuizQuery(lessonId: number | string | undefined) {
    return useQuery({
        queryKey: lessonQuizQueryKey(lessonId ?? "unknown"),
        enabled: lessonId !== undefined,
        queryFn: async (): Promise<StudentQuiz> => {
            const res = await apiClient(API_ENDPOINTS.QUIZZES.LESSON_QUIZ(lessonId as number | string));

            if (!res.ok) {
                throw new Error(`Failed to load lesson quiz (${res.status})`);
            }

            return res.json();
        },
    });
}
