import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg"
import { API_URL } from "@/config/constants";
import { ROLES, ROUTES, STORAGE_KEYS } from "../../config/constants";

const Login = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname as string | undefined;
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogin() {
        try {
            setError(null);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                setError(errorMessage);
                return;
            }

            const data = await response.json();

            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
            localStorage.setItem(STORAGE_KEYS.USER_ROLE, data.role);
            localStorage.setItem(STORAGE_KEYS.USERNAME, data.username);

            if (data.role === ROLES.ADMIN) {
                navigate(ROUTES.ADMIN.DASHBOARD, { replace: true });
                return;
            }

            if (from) {
                navigate(from, { replace: true });
            } else {
                navigate(ROUTES.STUDENT.DASHBOARD, { replace: true });
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Không thể kết nối server");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-5xl bg-white shadow-xl rounded-2xl flex overflow-hidden">
                {/* Left side */}
                <div className="hidden md:flex w-1/2 flex-col justify-center items-center p-10 bg-blue-600 text-white">
                    <div className="bg-white px-6 rounded-xl shadow">
                        <Link to="/" className="mb-6">
                            <img src={logo} alt="Logo" className="h-24 w-24" />
                        </Link>
                    </div>

                    <h1 className="text-3xl font-bold mb-4 text-center">
                        Chào mừng bạn đến với Ademy
                    </h1>

                    <p className="text-center text-lg opacity-90">
                        Nền tảng quản lý khóa học hiện đại, đơn giản và hiệu quả.
                    </p>
                </div>

                {/* Right side */}
                <div className="w-full md:w-1/2 flex items-center justify-center p-8">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin();
                        }}
                        className="w-full max-w-md"
                    >
                        <h2 className="text-2xl font-semibold text-left mb-6 text-blue-800">
                            Đăng nhập ngay!
                        </h2>

                        <div className="mb-4">
                            <label htmlFor="username" className="block font-semibold text-gray-700 mb-2">
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                id="username"
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập tên đăng nhập..."
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block font-semibold text-gray-700 mb-2">
                                Mật khẩu
                            </label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 border rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nhập mật khẩu..."
                                />

                                {/* Eye icon */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 px-3 py-2 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4 text-sm">
                            {/* Forgot password */}
                            <Link
                                to="/forgot-password"
                                className="font-medium text-blue-600 hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full font-bold bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Đăng nhập
                        </button>

                        {/* Signup */}
                        <p className="text-sm text-center text-gray-600 mt-4">
                            Bạn mới biết đến Ademy?{" "}
                            <Link
                                to={"/signup"}
                                className="font-medium text-blue-600 hover:underline"
                            >
                                Đăng ký ngay
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
