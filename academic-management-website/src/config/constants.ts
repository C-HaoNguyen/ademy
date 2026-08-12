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
        DELETE: "/admin/deleted-user",
    },

    // Courses
    COURSES: {
        LIST: "/courses",
        DETAIL: (id: string) => `/courses/${id}`,
        ADMIN_LIST: "/admin/courses",
        ADMIN_ADD: "/admin/courses/add",
        ADMIN_DELETE: "/admin/deleted-course",
        TOTAL: "/admin/total-courses",
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
    },

    // Admin Stats
    ADMIN: {
        TOTAL_USERS: "/admin/total-users",
        TOTAL_COURSES: "/admin/total-courses",
    },
} as const;

export const ROLES = {
    ADMIN: "ADMIN",
    INSTRUCTOR: "INSTRUCTOR",
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

    // Checkout
    CHECKOUT: "/checkout",

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
    },

    // Teacher (future)
    TEACHER: {
        ROOT: "/teacher",
        DASHBOARD: "/teacher/dashboard",
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