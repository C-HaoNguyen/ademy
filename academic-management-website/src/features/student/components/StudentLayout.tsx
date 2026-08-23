import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    BarChart3,
    ArrowLeft,
} from "lucide-react";
import AppShellLayout from "@/shared/layout/AppShellLayout";
import type { SidebarNavItem } from "@/shared/ui/SidebarNav";
import { ROUTES } from "@/config/constants";

const studentNavItems: SidebarNavItem[] = [
    { to: ROUTES.STUDENT.DASHBOARD, label: "Tổng quan", icon: LayoutDashboard },
    { to: ROUTES.STUDENT.MY_COURSES, label: "Khóa học của tôi", icon: BookOpen },
    { to: ROUTES.STUDENT.TEST_PRACTICE, label: "Luyện đề", icon: FileText },
    { to: ROUTES.STUDENT.LEARNING_PROFILE, label: "Hồ sơ học tập", icon: BarChart3 },
];

const StudentLayout = () => {
    return (
        <AppShellLayout
            navItems={studentNavItems}
            logoLabel="Ademy"
            homeRoute={ROUTES.HOME}
            profileRoute={ROUTES.STUDENT.PROFILE}
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
                        Trở về trang chủ
                    </button>
                </Link>
            }
        />
    );
};

export default StudentLayout;
