import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { API_ENDPOINTS, ROLES, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { useAuth } from "@/shared/auth/useAuth";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import { useToast } from "@/shared/ui/useToast";

type FormValues = {
    username: string;
    password: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = { username: "", password: "" };

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { showToast } = useToast();
    const from = location.state?.from?.pathname as string | undefined;

    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const validate = (): FormErrors => {
        const next: FormErrors = {};
        if (!values.username.trim()) next.username = "Vui lòng nhập tên đăng nhập";
        if (!values.password.trim()) next.password = "Vui lòng nhập mật khẩu";
        return next;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setSubmitting(true);
        try {
            const response = await apiClient(API_ENDPOINTS.AUTH.LOGIN, {
                method: "POST",
                body: JSON.stringify({
                    username: values.username,
                    password: values.password,
                }),
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                showToast({ tone: "danger", message: errorMessage || "Sai tên đăng nhập hoặc mật khẩu" });
                return;
            }

            const data = await response.json();

            login({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                role: data.role,
                username: data.username,
            });

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
                        <h1 className="mt-4 text-h3 text-primary">Đăng nhập vào Ademy</h1>
                        <p className="mt-1 text-body-sm text-secondary">
                            Chào mừng bạn quay lại
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                        <FormField label="Tên đăng nhập" required error={errors.username}>
                            <Input
                                value={values.username}
                                onChange={(e) => {
                                    setValues((v) => ({ ...v, username: e.target.value }));
                                    setErrors((err) => (err.username ? { ...err, username: undefined } : err));
                                }}
                                autoComplete="username"
                                placeholder="Nhập tên đăng nhập"
                            />
                        </FormField>

                        <FormField
                            label="Mật khẩu"
                            required
                            error={errors.password}
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
                                value={values.password}
                                onChange={(e) => {
                                    setValues((v) => ({ ...v, password: e.target.value }));
                                    setErrors((err) => (err.password ? { ...err, password: undefined } : err));
                                }}
                                autoComplete="current-password"
                                placeholder="Nhập mật khẩu"
                                className="pr-10"
                            />
                        </FormField>

                        <div className="flex justify-end text-body-sm">
                            <Link to={ROUTES.FORGOT_PASSWORD} className="font-medium text-brand hover:underline">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <Button type="submit" variant="primary" loading={submitting} className="w-full">
                            Đăng nhập
                        </Button>
                    </form>

                    <p className="mt-6 text-body-sm text-center text-secondary">
                        Bạn mới biết đến Ademy?{" "}
                        <Link to={ROUTES.SIGNUP} className="font-medium text-brand hover:underline">
                            Đăng ký ngay
                        </Link>
                    </p>
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
