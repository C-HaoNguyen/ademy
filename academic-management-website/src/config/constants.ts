export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: "/auth/login",
        SIGNUP: "/auth/signup",
        LOGOUT: "/auth/logout",
        REFRESH: "/auth/refresh",
    },

    // Users
    USERS: {
        ME: "/users/me",
        UPDATE_ME: "/users/me/update",
        LIST: "/admin/users",
        INVITE_TEACHER: "/admin/teachers",
        LOCK: (id: number | string) => `/admin/users/${id}/lock`,
        UNLOCK: (id: number | string) => `/admin/users/${id}/unlock`,
    },

    // Courses
    COURSES: {
        LIST: "/courses",
        DETAIL: (id: string) => `/courses/${id}`,
        LESSONS: (id: number | string) => `/courses/${id}/lessons`,
        ADMIN_LIST: "/admin/courses",
        ADMIN_FORCE_UNPUBLISH: (id: number | string) => `/admin/courses/${id}/force-unpublish`,
        ADMIN_STUDENTS: (id: number | string) => `/admin/courses/${id}/students`,
        TOTAL: "/admin/total-courses",
    },

    // Categories
    CATEGORIES: {
        LIST: "/categories",
        ADMIN_LIST: "/admin/categories",
        ADD: "/admin/categories/add",
        DETAIL: (id: number | string) => `/admin/categories/${id}`,
    },

    // Instructors
    INSTRUCTORS: {
        LIST: "/admin/instructors",
    },

    // Enrollments
    ENROLLMENTS: {
        CREATE: "/enrollments",
        MY_COURSES: "/enrollments/student/me/courses",
        MY_SUMMARY: "/enrollments/student/me/summary",
        ADMIN_REVOKE_ACCESS: (id: number | string) => `/admin/enrollments/${id}/revoke-access`,
    },

    // Quiz attempts
    QUIZ_ATTEMPTS: {
        MY_SUMMARY: "/quiz-attempts/me/summary",
    },

    // Payments (Phase 33 — Checkout 3 bước)
    PAYMENTS: {
        CHECKOUT: "/payments/checkout",
        VALIDATE_COUPON: "/payments/coupons/validate",
        STATUS: (ref: string) => `/payments/status?ref=${encodeURIComponent(ref)}`,
        ME: "/payments/me",
    },

    // Admin Stats
    ADMIN: {
        TOTAL_USERS: "/admin/total-users",
        TOTAL_COURSES: "/admin/total-courses",
        TOTAL_TEACHERS: "/admin/total-teachers",
        TOTAL_STUDENTS: "/admin/total-students",
        TOTAL_REVENUE: "/admin/total-revenue",
        PAYMENTS: "/admin/payments",
        RECENT_PENDING_REFUNDS: "/admin/refund-requests/pending-preview",
        RECENTLY_PUBLISHED_COURSES: "/admin/courses/recently-published",
    },

    // Teacher (Phase 30)
    TEACHER: {
        COURSES: "/teacher/courses",
        COURSE_DETAIL: (id: number | string) => `/teacher/courses/${id}`,
        STUDENTS_COUNT: "/teacher/courses/students-count",
        STUDENTS: (courseId: number | string) => `/teacher/courses/${courseId}/students`,
        LESSONS: (courseId: number | string) => `/teacher/courses/${courseId}/lessons`,
        LESSON_DETAIL: (courseId: number | string, lessonId: number | string) =>
            `/teacher/courses/${courseId}/lessons/${lessonId}`,
        LESSON_VIDEO_PRESIGN: (courseId: number | string, lessonId: number | string) =>
            `/teacher/courses/${courseId}/lessons/${lessonId}/video/presign`,
        COURSE_QUIZ: (courseId: number | string) => `/teacher/courses/${courseId}/quiz`,
        LESSON_QUIZ: (courseId: number | string, lessonId: number | string) =>
            `/teacher/courses/${courseId}/lessons/${lessonId}/quiz`,
    },
} as const;

export const ROLES = {
    ADMIN: "ADMIN",
    TEACHER: "TEACHER",
    STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROUTES = {
    // Public
    HOME: "/",
    COURSES: "/courses",
    COURSE_DETAIL: (id: string) => `/courses/${id}`,
    LECTURER: "/lecturer",
    CONTACT: "/contact",

    // Auth
    LOGIN: "/login",
    SIGNUP: "/signup",
    // Chưa có route thật (không phase nào định nghĩa trong AppRoutes.tsx) — centralize path
    // string cho link hiện có ở Login/Signup, không phải khai báo route đã implement.
    FORGOT_PASSWORD: "/forgot-password",
    TERMS: "/terms",
    PRIVACY: "/privacy",

    // Checkout (Phase 33 — 3 bước)
    CHECKOUT: "/checkout",
    CHECKOUT_PAYMENT: "/checkout/payment",
    CHECKOUT_RESULT: "/checkout/result",

    // Student
    STUDENT: {
        ROOT: "/student",
        DASHBOARD: "/student/dashboard",
        PROFILE: "/student/profile",
        MY_COURSES: "/student/my-courses",
        LEARNING_PROFILE: "/student/learning-profile",
        TEST_PRACTICE: "/student/test-practice",
    },

    // Admin
    ADMIN: {
        ROOT: "/admin",
        DASHBOARD: "/admin/dashboard",
        USERS: "/admin/users",
        COURSES: "/admin/courses",
        CATEGORIES: "/admin/categories",
        ORDERS: "/admin/orders",
        PROFILE: "/admin/profile",
    },

    // Teacher
    TEACHER: {
        ROOT: "/teacher",
        DASHBOARD: "/teacher/dashboard",
        COURSES: "/teacher/courses",
        COURSE_NEW: "/teacher/courses/new",
        COURSE_EDIT: (id: number | string) => `/teacher/courses/${id}/edit`,
    },
} as const;

export const STORAGE_KEYS = {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
    USER_ROLE: "userRole",
    USERNAME: "username",
} as const;

export const USER_STATUS = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const COURSE_LEVELS = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
} as const;

export const UI = {
    // Toast duration
    TOAST_DURATION: 3000,

    // Pagination
    DEFAULT_PAGE_SIZE: 10,

    // Debounce
    SEARCH_DEBOUNCE: 300,

    // Layout dimensions
    SIDEBAR_WIDTH: {
        ADMIN: 48,    // w-48 = 192px
        STUDENT: 64,  // w-64 = 256px
    },
    HEADER_HEIGHT: 16, // h-16 = 64px
} as const;