import { Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    BarChart3,
    ArrowLeft,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppShellLayout from "@/shared/layout/AppShellLayout";
import type { SidebarNavItem } from "@/shared/ui/SidebarNav";
import type { DropdownMenuItem } from "@/shared/ui/DropdownMenu";
import { useAuth } from "@/shared/auth/useAuth";
import { ROUTES } from "@/config/constants";

const StudentLayout = () => {
    const { t } = useTranslation("student");
    const navigate = useNavigate();
    const { logout } = useAuth();

    const studentNavItems: SidebarNavItem[] = [
        { to: ROUTES.STUDENT.DASHBOARD, label: t("layout.navDashboard"), icon: LayoutDashboard },
        { to: ROUTES.STUDENT.MY_COURSES, label: t("layout.navMyCourses"), icon: BookOpen },
        { to: ROUTES.STUDENT.TEST_PRACTICE, label: t("layout.navTestPractice"), icon: FileText },
        { to: ROUTES.STUDENT.LEARNING_PROFILE, label: t("layout.navLearningProfile"), icon: BarChart3 },
    ];

    const menuItems: DropdownMenuItem[] = [
        { label: t("layout.editProfile"), onClick: () => navigate(ROUTES.STUDENT.PROFILE) },
        { label: t("layout.logout"), onClick: () => logout(), destructive: true },
    ];

    return (
        <AppShellLayout
            navItems={studentNavItems}
            logoLabel="Ademy"
            homeRoute={ROUTES.HOME}
            menuItems={menuItems}
            sidebarFooterSlot={
                <Link to={ROUTES.HOME}>
                    <button
                        className="
                        group w-full flex items-center gap-3
                        px-4 py-2 rounded-radius-md text-body-lg font-medium
                        text-secondary cursor-pointer
                        hover:bg-surface-muted hover:text-nav-selected-text
                        transition-colors duration-200
                        active:scale-[0.97]
                    "
                    >
                        <ArrowLeft
                            size={22}
                            className="transition-transform duration-200 group-hover:-translate-x-1"
                        />
                        {t("layout.backToHome")}
                    </button>
                </Link>
            }
        />
    );
};

export default StudentLayout;
