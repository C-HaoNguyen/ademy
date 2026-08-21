import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Layers,
    CreditCard
} from "lucide-react";

const AdminSidebar = () => {
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-xl flex items-center gap-2 transition-colors duration-200 cursor-pointer font-medium
        ${isActive
            ? "bg-legacy-surface text-legacy-primary"
            : "text-slate-600 hover:bg-legacy-surface hover:text-legacy-primary"
        }`;

    return (
        <aside className="w-48 bg-white border-r min-h-screen">
            <div className="p-4 text-lg font-bold text-legacy-ink">
                Trang quản lý
            </div>

            <nav className="flex flex-col gap-1 px-2">
                <NavLink to="/admin/dashboard" className={linkClass}>
                    <LayoutDashboard size={18} />
                    Dashboard
                </NavLink>

                <NavLink to="/admin/users" className={linkClass}>
                    <Users size={18} />
                    Users
                </NavLink>

                <NavLink to="/admin/courses" className={linkClass}>
                    <BookOpen size={18} />
                    Courses
                </NavLink>

                <NavLink to="/admin/categories" className={linkClass}>
                    <Layers size={18} />
                    Categories
                </NavLink>

                <NavLink to="/admin/orders" className={linkClass}>
                    <CreditCard size={18} />
                    Orders
                </NavLink>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
