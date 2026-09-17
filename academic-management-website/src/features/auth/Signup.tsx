import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS, ROUTES } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import logo from "../../assets/logo.svg";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import { useToast } from "@/shared/ui/useToast";

const Signup = () => {
    const { t } = useTranslation(["auth", "common"]);
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
    const passwordError = passwordTouched && password.trim() === "" ? t("signup.validation.passwordRequired") : undefined;
    const confirmPasswordError =
        confirmPassword && password.trim() !== confirmPassword.trim() ? t("signup.validation.passwordMismatch") : undefined;

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
                showToast({ tone: "danger", message: errorText || t("signup.signupFailed") });
                return;
            }

            showToast({
                tone: "success",
                message: t("signup.signupSuccess"),
            });
            navigate(ROUTES.LOGIN);
        } catch (error) {
            console.error("Signup error:", error);
            showToast({ tone: "danger", message: t("signup.connectionError") });
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
                        <h1 className="mt-4 text-h3 text-primary">{t("signup.title")}</h1>
                        <p className="mt-1 text-body-sm text-secondary">
                            {t("signup.subtitle")}
                        </p>
                    </div>

                    <form
                        onSubmit={(e) => e.preventDefault()}
                        noValidate
                        className="mt-6 space-y-4"
                    >
                        <FormField label={t("signup.fullNameLabel")} required>
                            <Input
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoComplete="name"
                                placeholder={t("signup.fullNamePlaceholder")}
                            />
                        </FormField>

                        <FormField label={t("signup.usernameLabel")} required>
                            <Input
                                value={username}
                                onChange={(e) => setUserName(e.target.value)}
                                autoComplete="username"
                                placeholder={t("signup.usernamePlaceholder")}
                            />
                        </FormField>

                        <FormField label={t("signup.emailLabel")} required>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                placeholder={t("signup.emailPlaceholder")}
                            />
                        </FormField>

                        <FormField
                            label={t("signup.passwordLabel")}
                            required
                            error={passwordError}
                            endAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    aria-label={showPassword ? t("common:hidePassword") : t("common:showPassword")}
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
                                placeholder={t("signup.passwordPlaceholder")}
                                className="pr-10"
                            />
                        </FormField>

                        <FormField
                            label={t("signup.confirmPasswordLabel")}
                            required
                            error={confirmPasswordError}
                            endAdornment={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((s) => !s)}
                                    aria-label={showConfirmPassword ? t("common:hidePassword") : t("common:showPassword")}
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
                                placeholder={t("signup.confirmPasswordPlaceholder")}
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
                                {t("signup.agreeTermsPrefix")}{" "}
                                <Link to={ROUTES.TERMS} target="_blank" className="text-brand hover:underline">
                                    {t("signup.termsOfUse")}
                                </Link>{" "}
                                {t("signup.and")}{" "}
                                <Link to={ROUTES.PRIVACY} target="_blank" className="text-brand hover:underline">
                                    {t("signup.privacyPolicy")}
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
                            {t("signup.submit")}
                        </Button>
                    </form>

                    <p className="mt-6 text-body-sm text-center text-secondary">
                        {t("signup.hasAccount")}{" "}
                        <Link to={ROUTES.LOGIN} className="font-medium text-brand hover:underline">
                            {t("signup.loginNow")}
                        </Link>
                    </p>
                </Card>
            </motion.div>
        </div>
    );
};

export default Signup;
