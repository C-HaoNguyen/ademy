import {
    LayoutDashboard,
    Users,
    BookOpen,
    Layers,
    CreditCard,
} from "lucide-react";
import AppShellLayout from "@/shared/layout/AppShellLayout";
import type { SidebarNavItem } from "@/shared/ui/SidebarNav";
import { ROUTES } from "@/config/constants";

const adminNavItems: SidebarNavItem[] = [
    { to: ROUTES.ADMIN.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
    { to: ROUTES.ADMIN.USERS, label: "Users", icon: Users },
    { to: ROUTES.ADMIN.COURSES, label: "Courses", icon: BookOpen },
    { to: ROUTES.ADMIN.CATEGORIES, label: "Categories", icon: Layers },
    { to: ROUTES.ADMIN.ORDERS, label: "Orders", icon: CreditCard },
];

const AdminLayout = () => {
    return (
        <AppShellLayout
            navItems={adminNavItems}
            sidebarTitle="Trang quản lý"
            logoLabel="Ademy Admin"
            logoIcon="shield"
            homeRoute={ROUTES.ADMIN.DASHBOARD}
            profileRoute={ROUTES.ADMIN.PROFILE}
            showAdminMenuItem
        />
    );
};

export default AdminLayout;
