import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type TeacherLessonContentType = "video" | "document" | "quiz";

export type TeacherLesson = {
    lessonId: number;
    title: string;
    content?: string | null;
    orderIndex: number;
    duration?: number | null;
    preview: boolean;
    contentType: TeacherLessonContentType;
    videoUrl?: string | null;
    createdAt: string;
};

export const teacherLessonsQueryKey = (courseId: number | string) => ["teacher", "courses", courseId, "lessons"] as const;

export function useTeacherLessonsQuery(courseId: number | string | undefined) {
    return useQuery({
        queryKey: teacherLessonsQueryKey(courseId ?? "new"),
        enabled: courseId !== undefined,
        queryFn: async (): Promise<TeacherLesson[]> => {
            const res = await apiClient(API_ENDPOINTS.TEACHER.LESSONS(courseId as number | string));

            if (!res.ok) {
                throw new Error(`Failed to load lessons (${res.status})`);
            }

            return res.json();
        },
    });
}
