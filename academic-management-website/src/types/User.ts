export type UserProfile = {
    id: number;
    avatarUrl?: string;
    fullName: string;
    username: string;
    email: string;
    phone?: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt?: string;
};