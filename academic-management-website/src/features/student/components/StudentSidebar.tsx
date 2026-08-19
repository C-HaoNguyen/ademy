import { Link, NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    BarChart3,
    ArrowLeft,
} from "lucide-react";

const Sidebar = () => {

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `
        flex items-center gap-4
        px-4 py-3 rounded-2xl
        text-base font-medium
        transition-colors duration-200 cursor-pointer
        ${isActive
            ? "bg-surface text-primary"
            : "text-slate-600 hover:bg-surface hover:text-primary"
        }
    `;

    return (
        <aside className="w-64 bg-white border-r flex flex-col">
            {/* Main navigation */}
            <nav className="flex flex-col gap-3 px-2 py-3 flex-1">
                <NavLink to="/student/dashboard" className={linkClass}>
                    <LayoutDashboard
                        size={22}
                        className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                    />
                    Tổng quan
                </NavLink>

                <NavLink to="/student/my-courses" className={linkClass}>
                    <BookOpen size={22} className="shrink-0" />
                    Khóa học của tôi
                </NavLink>

                <NavLink to="/student/test-practice" className={linkClass}>
                    <FileText size={22} className="shrink-0" />
                    Luyện đề
                </NavLink>

                <NavLink to="/student/learning-profile" className={linkClass}>
                    <BarChart3 size={22} className="shrink-0" />
                    Hồ sơ học tập
                </NavLink>
            </nav>

            {/* Back to home button */}
            <div className="p-3 border-t">
                <Link
                    to={"/"}
                >
                    <button
                        className="
                        group w-full flex items-center gap-3
                        px-4 py-2 rounded-lg text-base font-medium
                        text-slate-600 cursor-pointer
                        hover:bg-surface hover:text-primary
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
            </div>
        </aside>
    );
};

export default Sidebar;
