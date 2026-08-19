import { useRef, useState, useEffect } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { isLoggedIn, logout } from "../../../utils/AuthUtils";
import logo from "../../../assets/logo.svg"

type Tab = {
    id: string;
    label: string;
    href: string;
};

function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [loggedIn, setLoggedIn] = useState(isLoggedIn());
    const dropdownRef = useRef<HTMLDivElement>(null);

    const tabs: Tab[] = [
        { id: "home", label: "Trang Chủ", href: "/" },
        { id: "courses", label: "Các Khóa Học", href: "/courses" },
        { id: "leturer", label: "Đội Ngũ", href: "/lecturer" },
        { id: "contact", label: "Liên Hệ", href: "/contact" },
    ];

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Re-check auth state on navigation and cross-tab storage changes
    useEffect(() => {
        setLoggedIn(isLoggedIn());
        const handleStorage = () => setLoggedIn(isLoggedIn());
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [location]);

    return (
        <header className="w-full bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex h-16 items-center justify-between">

                    {/* Logo */}
                    <div className="text-xl font-bold text-primary">
                        <img src={logo} alt="Ademy" className="h-12 w-12" />
                    </div>

                    {/* Tabs */}
                    <nav className="flex items-center space-x-2">
                        {tabs.map((tab) => (
                            <NavLink
                                key={tab.id}
                                to={tab.href}
                                end={tab.href === "/"}
                                className={({ isActive }) =>
                                    `relative px-4 py-2.5 text-sm font-semibold rounded-full transition-colors duration-200 cursor-pointer
                                    ${isActive
                                        ? "bg-surface text-primary"
                                        : "text-ink/70 hover:bg-surface hover:text-primary"}`
                                }
                            >
                                {tab.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Auth section */}
                    <div className="flex items-center gap-4">
                        {!loggedIn ? (
                            <>
                                <NavLink
                                    to="/login"
                                    className="px-6 py-2 text-sm font-semibold text-primary rounded-full transition-colors duration-200 cursor-pointer hover:bg-surface"
                                >
                                    Đăng nhập
                                </NavLink>

                                <NavLink
                                    to="/signup"
                                    className="px-6 py-2 text-sm font-semibold text-white bg-primary rounded-full transition-colors duration-200 cursor-pointer hover:bg-primary-dark shadow-sm"
                                >
                                    Đăng ký
                                </NavLink>
                            </>
                        ) : (
                            <>
                                {/* Start learning button */}
                                <button
                                    onClick={() => navigate("/student/dashboard")}
                                    className="px-4 py-2 rounded-full
                                                text-sm font-semibold
                                                text-white bg-cta
                                                hover:bg-cta-dark
                                                transition-colors duration-200
                                                shadow-sm cursor-pointer
                                                active:scale-[0.97]"
                                >
                                    Bắt đầu học
                                </button>
                                {/* Avatar dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setOpen(!open)}
                                        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-surface transition-colors cursor-pointer"
                                    >
                                        <img
                                            src="https://cdn-icons-png.flaticon.com/512/8188/8188362.png"
                                            alt="avatar"
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <ChevronDown
                                            size={16}
                                            className={`text-ink/50 transition-transform ${open ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {open && (
                                        <div
                                            className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-dropdown"
                                        >
                                            <button
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-surface cursor-pointer"
                                                onClick={() => navigate("/student/profile")}
                                            >
                                                <User size={16} />
                                                Chỉnh sửa hồ sơ
                                            </button>

                                            <div className="h-px bg-slate-100" />

                                            <button
                                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                                onClick={() => logout()}
                                            >
                                                <LogOut size={16} />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;