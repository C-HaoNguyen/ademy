import { LayoutDashboard, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShellLayout from "@/shared/layout/AppShellLayout";
import type { SidebarNavItem } from "@/shared/ui/SidebarNav";
import type { DropdownMenuItem } from "@/shared/ui/DropdownMenu";
import { useAuth } from "@/shared/auth/useAuth";
import { ROUTES } from "@/config/constants";

const teacherNavItems: SidebarNavItem[] = [
    { to: ROUTES.TEACHER.DASHBOARD, label: "Tổng quan", icon: LayoutDashboard },
    { to: ROUTES.TEACHER.COURSES, label: "Khóa học của tôi", icon: BookOpen },
];

const TeacherLayout = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems: DropdownMenuItem[] = [
        { label: "Hồ sơ giảng viên", onClick: () => navigate(ROUTES.TEACHER.PROFILE) },
        { label: "Đăng xuất", onClick: () => logout(), destructive: true },
    ];

    return (
        <AppShellLayout
            navItems={teacherNavItems}
            logoLabel="Ademy Teacher"
            homeRoute={ROUTES.TEACHER.DASHBOARD}
            menuItems={menuItems}
        />
    );
};

export default TeacherLayout;
