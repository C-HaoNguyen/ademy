import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type TeacherCourse = {
    courseId: number;
    title: string;
    description?: string | null;
    thumbnail?: string | null;
    price: number;
    level?: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    instructor: {
        userId: number;
        username: string;
        fullName: string;
    };
    category: {
        categoryId: number;
        categoryName: string;
    } | null;
};

export type TeacherCourseStudentCount = {
    courseId: number;
    studentCount: number;
};

export const teacherCoursesQueryKey = ["teacher", "courses"] as const;
export const teacherCourseQueryKey = (courseId: number | string) => ["teacher", "courses", courseId] as const;
export const teacherStudentCountsQueryKey = ["teacher", "courses", "students-count"] as const;

export function useTeacherCoursesQuery() {
    return useQuery({
        queryKey: teacherCoursesQueryKey,
        queryFn: async (): Promise<TeacherCourse[]> => {
            const res = await apiClient(API_ENDPOINTS.TEACHER.COURSES);

            if (!res.ok) {
                throw new Error(`Failed to load teacher courses (${res.status})`);
            }

            return res.json();
        },
    });
}

export function useTeacherCourseQuery(courseId: number | string | undefined) {
    return useQuery({
        queryKey: teacherCourseQueryKey(courseId ?? "new"),
        enabled: courseId !== undefined,
        queryFn: async (): Promise<TeacherCourse> => {
            const res = await apiClient(API_ENDPOINTS.TEACHER.COURSE_DETAIL(courseId as number | string));

            if (!res.ok) {
                throw new Error(`Failed to load teacher course (${res.status})`);
            }

            return res.json();
        },
    });
}

export function useTeacherStudentCountsQuery() {
    return useQuery({
        queryKey: teacherStudentCountsQueryKey,
        queryFn: async (): Promise<TeacherCourseStudentCount[]> => {
            const res = await apiClient(API_ENDPOINTS.TEACHER.STUDENTS_COUNT);

            if (!res.ok) {
                throw new Error(`Failed to load teacher student counts (${res.status})`);
            }

            return res.json();
        },
    });
}
