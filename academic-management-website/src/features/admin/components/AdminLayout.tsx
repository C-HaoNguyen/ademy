import {
    LayoutDashboard,
    Users,
    BookOpen,
    Layers,
    CreditCard,
    Ticket,
    RotateCcw,
    ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppShellLayout from "@/shared/layout/AppShellLayout";
import type { SidebarNavItem } from "@/shared/ui/SidebarNav";
import type { DropdownMenuItem } from "@/shared/ui/DropdownMenu";
import { useAuth } from "@/shared/auth/useAuth";
import { ROUTES } from "@/config/constants";

const AdminLayout = () => {
    const { t } = useTranslation("admin");
    const navigate = useNavigate();
    const { logout } = useAuth();

    const adminNavItems: SidebarNavItem[] = [
        { to: ROUTES.ADMIN.DASHBOARD, label: t("layout.navDashboard"), icon: LayoutDashboard },
        { to: ROUTES.ADMIN.USERS, label: t("layout.navUsers"), icon: Users },
        { to: ROUTES.ADMIN.COURSES, label: t("layout.navCourses"), icon: BookOpen },
        { to: ROUTES.ADMIN.CATEGORIES, label: t("layout.navCategories"), icon: Layers },
        { to: ROUTES.ADMIN.ORDERS, label: t("layout.navOrders"), icon: CreditCard },
        { to: ROUTES.ADMIN.COUPONS, label: t("layout.navCoupons"), icon: Ticket },
        { to: ROUTES.ADMIN.REFUNDS, label: t("layout.navRefunds"), icon: RotateCcw },
        { to: ROUTES.ADMIN.AUDIT_LOG, label: t("layout.navAuditLog"), icon: ClipboardList },
    ];

    const menuItems: DropdownMenuItem[] = [
        { label: t("layout.profile"), onClick: () => navigate(ROUTES.ADMIN.PROFILE) },
        { label: t("layout.adminPermissions"), onClick: () => {} },
        { label: t("layout.logout"), onClick: () => logout(), destructive: true },
    ];

    return (
        <AppShellLayout
            navItems={adminNavItems}
            sidebarTitle={t("layout.sidebarTitle")}
            logoLabel="Ademy Admin"
            logoIcon="shield"
            homeRoute={ROUTES.ADMIN.DASHBOARD}
            menuItems={menuItems}
            avatarAlt={t("layout.avatarAlt")}
        />
    );
};

export default AdminLayout;
