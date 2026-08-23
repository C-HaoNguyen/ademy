import { Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import SidebarNav, { type SidebarNavItem } from "@/shared/ui/SidebarNav";
import AppHeader from "@/shared/layout/AppHeader";

interface AppShellLayoutProps {
    navItems: SidebarNavItem[];
    sidebarTitle?: string;
    sidebarFooterSlot?: ReactNode;
    logoLabel: string;
    logoIcon?: "brand" | "shield";
    homeRoute: string;
    profileRoute: string;
    showAdminMenuItem?: boolean;
}

const AppShellLayout = ({
    navItems,
    sidebarTitle,
    sidebarFooterSlot,
    logoLabel,
    logoIcon,
    homeRoute,
    profileRoute,
    showAdminMenuItem,
}: AppShellLayoutProps) => {
    return (
        <div className="min-h-screen bg-surface-muted">
            <div className="fixed top-0 left-0 right-0 h-16 z-sticky">
                <AppHeader
                    logoLabel={logoLabel}
                    logoIcon={logoIcon}
                    homeRoute={homeRoute}
                    profileRoute={profileRoute}
                    showAdminMenuItem={showAdminMenuItem}
                />
            </div>

            <div className="pt-16 flex">
                <div className="fixed left-0 top-16 h-[calc(100vh-64px)] w-[260px]">
                    <SidebarNav items={navItems} title={sidebarTitle} footerSlot={sidebarFooterSlot} />
                </div>

                <main className="ml-[260px] flex-1 p-6 min-h-[calc(100vh-64px)]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppShellLayout;
