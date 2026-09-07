import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type TeacherQuizChoice = {
    id?: number;
    choiceText: string;
    isCorrect: boolean;
    orderIndex: number;
};

export type TeacherQuizQuestion = {
    id?: number;
    questionText: string;
    orderIndex: number;
    choices: TeacherQuizChoice[];
};

export type TeacherQuiz = {
    id: number;
    courseId: number | null;
    lessonId: number | null;
    title: string;
    questions: TeacherQuizQuestion[];
};

export const teacherCourseQuizQueryKey = (courseId: number | string) =>
    ["teacher", "courses", courseId, "quiz"] as const;
export const teacherLessonQuizQueryKey = (courseId: number | string, lessonId: number | string) =>
    ["teacher", "courses", courseId, "lessons", lessonId, "quiz"] as const;

// GET .../quiz trả 404 khi chưa có quiz — đây là empty state hợp lệ (UI_SPEC §4.3 "Chưa có câu hỏi
// nào"), không phải lỗi. queryFn trả về null cho case này thay vì throw.
export function useTeacherCourseQuizQuery(courseId: number | string | undefined) {
    return useQuery({
        queryKey: teacherCourseQuizQueryKey(courseId ?? "new"),
        enabled: courseId !== undefined,
        queryFn: async (): Promise<TeacherQuiz | null> => {
            const res = await apiClient(API_ENDPOINTS.TEACHER.COURSE_QUIZ(courseId as number | string));

            if (res.status === 404) {
                return null;
            }
            if (!res.ok) {
                throw new Error(`Failed to load course quiz (${res.status})`);
            }

            return res.json();
        },
    });
}

export function useTeacherLessonQuizQuery(
    courseId: number | string | undefined,
    lessonId: number | string | undefined
) {
    return useQuery({
        queryKey: teacherLessonQuizQueryKey(courseId ?? "new", lessonId ?? "new"),
        enabled: courseId !== undefined && lessonId !== undefined,
        queryFn: async (): Promise<TeacherQuiz | null> => {
            const res = await apiClient(
                API_ENDPOINTS.TEACHER.LESSON_QUIZ(courseId as number | string, lessonId as number | string)
            );

            if (res.status === 404) {
                return null;
            }
            if (!res.ok) {
                throw new Error(`Failed to load lesson quiz (${res.status})`);
            }

            return res.json();
        },
    });
}
