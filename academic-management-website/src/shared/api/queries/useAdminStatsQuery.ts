import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type RecentPendingRefund = {
    id: number;
    courseTitle: string;
    amount: number;
    requestedAt: string;
};

export type RecentlyPublishedCourse = {
    courseId: number;
    title: string;
    thumbnail?: string;
    instructorName?: string;
    updatedAt: string;
};

export const totalStudentsQueryKey = ["admin", "stats", "totalStudents"] as const;
export const totalCoursesQueryKey = ["admin", "stats", "totalCourses"] as const;
export const totalTeachersQueryKey = ["admin", "stats", "totalTeachers"] as const;
export const totalRevenueQueryKey = ["admin", "stats", "totalRevenue"] as const;
export const recentPendingRefundsQueryKey = ["admin", "stats", "recentPendingRefunds"] as const;
export const recentlyPublishedCoursesQueryKey = ["admin", "stats", "recentlyPublishedCourses"] as const;

async function fetchTotalStudents(): Promise<number> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.TOTAL_STUDENTS);

    if (!res.ok) {
        throw new Error(`Failed to load total students (${res.status})`);
    }

    const data = await res.json();
    return data.totalStudents;
}

async function fetchTotalCourses(): Promise<number> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.TOTAL_COURSES);

    if (!res.ok) {
        throw new Error(`Failed to load total courses (${res.status})`);
    }

    const data = await res.json();
    return data.totalCourses;
}

async function fetchTotalTeachers(): Promise<number> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.TOTAL_TEACHERS);

    if (!res.ok) {
        throw new Error(`Failed to load total teachers (${res.status})`);
    }

    const data = await res.json();
    return data.totalTeachers;
}

async function fetchTotalRevenue(): Promise<number> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.TOTAL_REVENUE);

    if (!res.ok) {
        throw new Error(`Failed to load total revenue (${res.status})`);
    }

    const data = await res.json();
    return data.totalRevenue;
}

async function fetchRecentPendingRefunds(): Promise<RecentPendingRefund[]> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.RECENT_PENDING_REFUNDS);

    if (!res.ok) {
        throw new Error(`Failed to load recent pending refunds (${res.status})`);
    }

    return res.json();
}

async function fetchRecentlyPublishedCourses(): Promise<RecentlyPublishedCourse[]> {
    const res = await apiClient(API_ENDPOINTS.ADMIN.RECENTLY_PUBLISHED_COURSES);

    if (!res.ok) {
        throw new Error(`Failed to load recently published courses (${res.status})`);
    }

    return res.json();
}

// 6 query độc lập (đúng nguyên tắc 1-hook-1-concern đã chốt ở code review Phase 28 — 1 request lỗi
// không kéo request khác lỗi theo).
export function useTotalStudentsQuery() {
    return useQuery({ queryKey: totalStudentsQueryKey, queryFn: fetchTotalStudents });
}

export function useTotalCoursesQuery() {
    return useQuery({ queryKey: totalCoursesQueryKey, queryFn: fetchTotalCourses });
}

export function useTotalTeachersQuery() {
    return useQuery({ queryKey: totalTeachersQueryKey, queryFn: fetchTotalTeachers });
}

export function useTotalRevenueQuery() {
    return useQuery({ queryKey: totalRevenueQueryKey, queryFn: fetchTotalRevenue });
}

export function useRecentPendingRefundsQuery() {
    return useQuery({ queryKey: recentPendingRefundsQueryKey, queryFn: fetchRecentPendingRefunds });
}

export function useRecentlyPublishedCoursesQuery() {
    return useQuery({ queryKey: recentlyPublishedCoursesQueryKey, queryFn: fetchRecentlyPublishedCourses });
}
