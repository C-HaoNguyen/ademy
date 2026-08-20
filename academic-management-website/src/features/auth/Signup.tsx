import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import logo from "../../assets/logo.svg";

const Signup = () => {

    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [username, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const isFormValid =
        fullName.trim() !== "" &&
        username.trim() !== "" &&
        email.trim() !== "" &&
        password.trim() !== "" &&
        password.trim() === confirmPassword.trim() &&
        agreeTerms;

    const handleSignup = async () => {
        try {
            const response = await apiClient(API_ENDPOINTS.AUTH.SIGNUP, {
                method: "POST",
                body: JSON.stringify({
                    signupUsername: username,
                    signupFullName: fullName,
                    signupEmail: email,
                    signupPassword: password,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(errorText);
                return;
            }

            alert("Đăng ký thành công! Bạn sẽ được chuyển hướng đến trang đăng nhập.");
            navigate("/login");
        } catch (error) {
            console.error("Signup error:", error);
            alert("Không thể kết nối server");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form
                onSubmit={(e) => e.preventDefault()}
                className="bg-white px-8 py-6 rounded-2xl shadow-lg w-full max-w-lg"
            >
                <Link
                    to="/"
                    className="flex justify-center"
                >
                    <div className="flex items-center gap-2 cursor-pointer">
                        <div
                            className="w-10 h-10 rounded-full bg-blue-600
                       flex items-center justify-center
                       text-white font-bold text-lg"
                        >
                            A
                        </div>
                        <img src={logo} alt="Logo" className="h-24 w-24" />
                    </div>
                </Link>

                <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">
                    Đăng ký tài khoản
                </h2>

                {/* Full name */}
                <div className="mb-2">
                    <label className="block text-gray-700 mb-2">
                        Họ và tên
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nguyễn Văn A"
                    />
                </div>

                {/* Username */}
                <div className="mb-2">
                    <label className="block text-gray-700 mb-2">
                        Tên đăng nhập
                    </label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tên đăng nhập..."
                    />
                </div>

                {/* Email */}
                <div className="mb-2">
                    <label className="block text-gray-700 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="example@gmail.com"
                    />
                </div>

                {/* Password */}
                <div className="mb-2">
                    <label className="block text-gray-700 mb-2">
                        Mật khẩu
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => setPasswordTouched(true)}
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
                    {passwordTouched && password.trim() === "" && (
                        <p className="text-sm text-red-500 mt-1">
                            Mật khẩu không được để trống
                        </p>
                    )}
                </div>

                {/* Confirm password */}
                <div className="mb-2">
                    <label className="block text-gray-700 mb-2">
                        Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nhập lại mật khẩu..."
                        />
                        {/* Eye icon */}
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {confirmPassword && password.trim() !== confirmPassword.trim() && (
                        <p className="text-sm text-red-500 mt-1">
                            Mật khẩu xác nhận không khớp
                        </p>
                    )}
                </div>

                {/* Terms & conditions */}
                <div className="mb-6 mt-4">
                    <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="mt-1 rounded border-gray-300"
                        />
                        <span>
                            Tôi đồng ý với{" "}
                            <Link
                                to="/terms"
                                target="_blank"
                                className="text-blue-600 hover:underline"
                            >
                                Điều khoản sử dụng
                            </Link>{" "}
                            và{" "}
                            <Link
                                to="/privacy"
                                target="_blank"
                                className="text-blue-600 hover:underline"
                            >
                                Chính sách bảo mật
                            </Link>
                        </span>
                    </label>
                </div>


                {/* Submit */}
                <button
                    type="button"
                    onClick={handleSignup}
                    disabled={!isFormValid}
                    className={`w-full py-2 rounded-lg transition
                        ${isFormValid
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }
                    `}
                >
                    Đăng ký
                </button>

                {/* Redirect login */}
                <p className="text-sm text-center text-gray-600 mt-4">
                    Đã có tài khoản?{" "}
                    <Link
                        to={"/login"}
                        className="text-blue-600 hover:underline"
                    >
                        Đăng nhập
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Signup;
