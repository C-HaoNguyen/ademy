import { LayoutDashboard, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppShellLayout from "@/shared/layout/AppShellLayout";
import type { SidebarNavItem } from "@/shared/ui/SidebarNav";
import type { DropdownMenuItem } from "@/shared/ui/DropdownMenu";
import { useAuth } from "@/shared/auth/useAuth";
import { ROUTES } from "@/config/constants";

const TeacherLayout = () => {
    const { t } = useTranslation("teacher");
    const navigate = useNavigate();
    const { logout } = useAuth();

    const teacherNavItems: SidebarNavItem[] = [
        { to: ROUTES.TEACHER.DASHBOARD, label: t("layout.navDashboard"), icon: LayoutDashboard },
        { to: ROUTES.TEACHER.COURSES, label: t("layout.navMyCourses"), icon: BookOpen },
    ];

    const menuItems: DropdownMenuItem[] = [
        { label: t("layout.profile"), onClick: () => navigate(ROUTES.TEACHER.PROFILE) },
        { label: t("layout.logout"), onClick: () => logout(), destructive: true },
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
