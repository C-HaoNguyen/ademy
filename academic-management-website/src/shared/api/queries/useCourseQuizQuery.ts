import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type QuizChoice = {
    id: number;
    choiceText: string;
    orderIndex: number;
};

export type QuizQuestion = {
    id: number;
    questionText: string;
    orderIndex: number;
    choices: QuizChoice[];
};

export type StudentQuiz = {
    id: number;
    title: string;
    questions: QuizQuestion[];
};

export const courseQuizQueryKey = (courseId: number | string) =>
    ["student", "courseQuiz", courseId] as const;

// Test tổng khóa học (quiz.course != null) — Phase 34 chỉ cần biến thể course-level, không phải
// lesson-level (Lesson Player thuộc Phase 35).
export function useCourseQuizQuery(courseId: number | string | undefined) {
    return useQuery({
        queryKey: courseQuizQueryKey(courseId ?? "unknown"),
        enabled: courseId !== undefined,
        queryFn: async (): Promise<StudentQuiz> => {
            const res = await apiClient(API_ENDPOINTS.QUIZZES.COURSE_QUIZ(courseId as number | string));

            if (!res.ok) {
                throw new Error(`Failed to load quiz (${res.status})`);
            }

            return res.json();
        },
    });
}
