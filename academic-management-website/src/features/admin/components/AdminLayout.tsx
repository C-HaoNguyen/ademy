import {
    LayoutDashboard,
    Users,
    BookOpen,
    Layers,
    CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShellLayout from "@/shared/layout/AppShellLayout";
import type { SidebarNavItem } from "@/shared/ui/SidebarNav";
import type { DropdownMenuItem } from "@/shared/ui/DropdownMenu";
import { useAuth } from "@/shared/auth/useAuth";
import { ROUTES } from "@/config/constants";

const adminNavItems: SidebarNavItem[] = [
    { to: ROUTES.ADMIN.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
    { to: ROUTES.ADMIN.USERS, label: "Users", icon: Users },
    { to: ROUTES.ADMIN.COURSES, label: "Courses", icon: BookOpen },
    { to: ROUTES.ADMIN.CATEGORIES, label: "Categories", icon: Layers },
    { to: ROUTES.ADMIN.ORDERS, label: "Orders", icon: CreditCard },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems: DropdownMenuItem[] = [
        { label: "Hồ sơ Admin", onClick: () => navigate(ROUTES.ADMIN.PROFILE) },
        { label: "Quyền quản trị", onClick: () => {} },
        { label: "Đăng xuất", onClick: () => logout(), destructive: true },
    ];

    return (
        <AppShellLayout
            navItems={adminNavItems}
            sidebarTitle="Trang quản lý"
            logoLabel="Ademy Admin"
            logoIcon="shield"
            homeRoute={ROUTES.ADMIN.DASHBOARD}
            menuItems={menuItems}
            avatarAlt="admin avatar"
        />
    );
};

export default AdminLayout;
