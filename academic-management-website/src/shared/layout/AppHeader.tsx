import { Bell, ChevronDown, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import DropdownMenu, { type DropdownMenuItem } from "@/shared/ui/DropdownMenu";

interface AppHeaderProps {
    logoLabel: string;
    logoIcon?: "brand" | "shield";
    homeRoute: string;
    profileRoute: string;
    showAdminMenuItem?: boolean;
}

const AppHeader = ({ logoLabel, logoIcon = "brand", homeRoute, profileRoute, showAdminMenuItem = false }: AppHeaderProps) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const menuItems: DropdownMenuItem[] = [
        {
            label: showAdminMenuItem ? "Hồ sơ Admin" : "Chỉnh sửa hồ sơ",
            onClick: () => navigate(profileRoute),
        },
        ...(showAdminMenuItem
            ? [{ label: "Quyền quản trị", onClick: () => {} } as DropdownMenuItem]
            : []),
        { label: "Đăng xuất", onClick: () => logout(), destructive: true },
    ];

    return (
        <header className="h-16 bg-surface border-b border-default px-6 flex items-center justify-between">
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate(homeRoute)}
            >
                <div className="w-9 h-9 bg-action-primary-bg text-inverse rounded-radius-lg flex items-center justify-center font-bold">
                    {logoIcon === "shield" ? <ShieldCheck size={20} /> : "A"}
                </div>
                <span className="font-semibold text-primary text-h3">{logoLabel}</span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    className="relative p-2 rounded-radius-full hover:bg-surface-muted transition-all active:scale-95"
                >
                    <Bell size={20} className="text-secondary" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-status-danger-icon rounded-radius-full" />
                </button>

                <DropdownMenu
                    items={menuItems}
                    trigger={
                        <button className="flex items-center gap-2 px-2 py-1 rounded-radius-full hover:bg-surface-muted transition-all">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/8188/8188362.png"
                                alt={showAdminMenuItem ? "admin avatar" : "avatar"}
                                className="w-8 h-8 rounded-radius-full object-cover"
                            />
                            <ChevronDown size={16} className="text-secondary" />
                        </button>
                    }
                />
            </div>
        </header>
    );
};

export default AppHeader;
