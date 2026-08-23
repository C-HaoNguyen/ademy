import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface SidebarNavItem {
    to: string;
    label: string;
    icon: LucideIcon;
}

interface SidebarNavProps {
    items: SidebarNavItem[];
    title?: string;
    footerSlot?: ReactNode;
}

const SidebarNav = ({ items, title, footerSlot }: SidebarNavProps) => {
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-radius-md text-body-lg font-medium transition-colors duration-200 cursor-pointer border-l-2 ${
            isActive
                ? "bg-nav-selected-bg text-nav-selected-text border-nav-selected-indicator"
                : "text-secondary border-transparent hover:bg-surface-muted hover:text-nav-selected-text"
        }`;

    return (
        <aside className="w-[260px] h-full bg-surface border-r border-default flex flex-col">
            {title && (
                <div className="p-4 text-h4 text-primary">{title}</div>
            )}

            <nav className="flex flex-col gap-1 px-2 py-3 flex-1">
                {items.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} className={linkClass}>
                        <Icon size={18} className="shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {footerSlot && <div className="p-3 border-t border-default">{footerSlot}</div>}
        </aside>
    );
};

export default SidebarNav;
