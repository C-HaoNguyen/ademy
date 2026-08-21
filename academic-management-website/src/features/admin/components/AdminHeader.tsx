import { useEffect, useRef, useState } from "react";
import {
    Bell,
    ChevronDown,
    LogOut,
    User,
    Shield,
    ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";

const AdminHeader = () => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Close dropdown when clicking outside
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
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="h-16 bg-white border-b px-6 flex items-center justify-between">
            {/* Left: Logo */}
            <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate("/admin/dashboard")}
            >
                <div className="w-9 h-9 bg-legacy-primary text-white rounded-lg flex items-center justify-center">
                    <ShieldCheck size={20} />
                </div>
                <span className="font-semibold text-legacy-ink text-xl">
                    Ademy Admin
                </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Notification */}
                <button
                    className="
                        relative p-2 rounded-full
                        hover:bg-gray-100
                        transition-all
                        active:scale-95
                    "
                >
                    <Bell size={20} className="text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Avatar dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen(!open)}
                        className="
                            flex items-center gap-2
                            px-2 py-1 rounded-full
                            hover:bg-gray-100
                            transition-all
                        "
                    >
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/8188/8188362.png"
                            alt="admin avatar"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                        <ChevronDown
                            size={16}
                            className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    {/* Dropdown menu */}
                    {open && (
                        <div
                            className="
                                absolute right-0 mt-2 w-52
                                bg-white border rounded-xl shadow-lg
                                overflow-hidden
                            "
                        >
                            <button
                                className="
                                    w-full flex items-center gap-2
                                    px-4 py-3 text-sm text-gray-700
                                    hover:bg-gray-100
                                "
                                onClick={() => navigate("/admin/profile")}
                            >
                                <User size={16} />
                                Hồ sơ Admin
                            </button>

                            <button
                                className="
                                    w-full flex items-center gap-2
                                    px-4 py-3 text-sm text-gray-700
                                    hover:bg-gray-100
                                "
                            >
                                <Shield size={16} />
                                Quyền quản trị
                            </button>

                            <div className="h-px bg-gray-100" />

                            <button
                                className="
                                    w-full flex items-center gap-2
                                    px-4 py-3 text-sm text-red-600
                                    hover:bg-red-50
                                "
                                onClick={() => logout()}
                            >
                                <LogOut size={16} />
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
