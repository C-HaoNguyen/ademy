import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import logo from "../../assets/logo.svg";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import { useToast } from "@/shared/ui/useToast";

const Signup = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [fullName, setFullName] = useState("");
    const [username, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const passwordError = passwordTouched && password.trim() === "" ? "Mật khẩu không được để trống" : undefined;
    const confirmPasswordError =
        confirmPassword && password.trim() !== confirmPassword.trim() ? "Mật khẩu xác nhận không khớp" : undefined;

    const isFormValid =
        fullName.trim() !== "" &&
        username.trim() !== "" &&
        email.trim() !== "" &&
        password.trim() !== "" &&
        password.trim() === confirmPassword.trim() &&
        agreeTerms;

    const handleSignup = async () => {
        setSubmitting(true);
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
                showToast({ tone: "danger", message: errorText || "Đăng ký thất bại" });
                return;
            }

            showToast({
                tone: "success",
                message: "Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập.",
            });
            navigate(ROUTES.LOGIN);
        } catch (error) {
            console.error("Signup error:", error);
            showToast({ tone: "danger", message: "Không thể kết nối server" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-background flex items-center justify-center px-6 py-16 md:py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-[420px]"
            >
                <Card variant="marketing">
                    <div className="flex flex-col items-center text-center">
                        <Link to={ROUTES.HOME}>
                            <img src={logo} alt="Ademy" className="h-12 w-12" />
                        </Link>
                        <h1 className="mt-4 text-h3 text-primary">Đăng ký tài khoản</h1>
                        <p className="mt-1 text-body-sm text-secondary">
                            Tạo tài khoản Student để bắt đầu học tập
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => e.preventDefault()}
                        noValidate
                        className="mt-6 space-y-4"
                    >
                        <FormField label="Họ và tên" required>
                            <Input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoComplete="name"
                                placeholder="Nguyễn Văn A"
                            />
                        </FormField>

                        <FormField label="Tên đăng nhập" required>
                            <Input
                                value={username}
                                onChange={(e) => setUserName(e.target.value)}
                                autoComplete="username"
                                placeholder="Tên đăng nhập"
                            />
                        </FormField>

                        <FormField label="Email" required>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder="example@gmail.com"
                            />
                        </FormField>

                        <FormField
                            label="Mật khẩu"
                            required
                            error={passwordError}
                            endAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        >
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => setPasswordTouched(true)}
                                autoComplete="new-password"
                                placeholder="Nhập mật khẩu"
                                className="pr-10"
                            />
                        </FormField>

                        <FormField
                            label="Xác nhận mật khẩu"
                            required
                            error={confirmPasswordError}
                            endAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((s) => !s)}
                                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            }
                        >
                            <Input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                                placeholder="Nhập lại mật khẩu"
                                className="pr-10"
                            />
                        </FormField>

                        <label className="flex items-start gap-2 text-body-sm text-secondary cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                                className="mt-1 rounded border-default"
                            />
                            <span>
                                Tôi đồng ý với{" "}
                                <Link to={ROUTES.TERMS} target="_blank" className="text-brand hover:underline">
                                    Điều khoản sử dụng
                                </Link>{" "}
                                và{" "}
                                <Link to={ROUTES.PRIVACY} target="_blank" className="text-brand hover:underline">
                                    Chính sách bảo mật
                                </Link>
                            </span>
                        </label>

                        <Button
                            type="button"
                            variant="primary"
                            loading={submitting}
                            disabled={!isFormValid}
                            onClick={handleSignup}
                            className="w-full"
                        >
                            Đăng ký
                        </Button>
                    </form>

                    <p className="mt-6 text-body-sm text-center text-secondary">
                        Đã có tài khoản?{" "}
                        <Link to={ROUTES.LOGIN} className="font-medium text-brand hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </Card>
            </motion.div>
        </div>
    );
};

export default Signup;
