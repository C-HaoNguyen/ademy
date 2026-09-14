import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type StudentLesson = {
    lessonId: number;
    title: string;
    content: string | null;
    contentType: "video" | "document" | "quiz";
    videoUrl: string | null;
    duration: number | null;
    orderIndex: number;
    preview: boolean;
    completed: boolean;
};

export type StudentCourseLessons = {
    courseId: number;
    courseTitle: string;
    lessons: StudentLesson[];
    progressPercent: number;
    enrolled: boolean;
};

export const lessonPlayerQueryKey = (courseId: number | string) =>
    ["student", "lessonPlayer", courseId] as const;

// Phase 35 — Lesson Player: 1 request duy nhất cho toàn bộ layout (topbar + sidebar + nội dung mỗi
// lesson) — content/videoUrl trả kèm luôn trong từng lesson để chuyển lesson không cần gọi lại API.
export function useLessonPlayerQuery(courseId: number | string | undefined) {
    return useQuery({
        queryKey: lessonPlayerQueryKey(courseId ?? "unknown"),
        enabled: courseId !== undefined,
        queryFn: async (): Promise<StudentCourseLessons> => {
            const res = await apiClient(API_ENDPOINTS.LESSONS.COURSE_LESSONS(courseId as number | string));

            if (!res.ok) {
                throw new Error(`Failed to load course lessons (${res.status})`);
            }

            return res.json();
        },
    });
}
