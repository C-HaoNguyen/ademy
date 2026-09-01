import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Card from "@/shared/ui/Card";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";
import Textarea from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/useToast";

type FormValues = {
    fullName: string;
    email: string;
    message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialValues: FormValues = { fullName: "", email: "", message: "" };

const ContactPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const validate = (): FormErrors => {
        const next: FormErrors = {};
        if (!values.fullName.trim()) next.fullName = "Vui lòng nhập họ và tên";
        if (!values.email.trim()) next.email = "Vui lòng nhập email";
        else if (!EMAIL_PATTERN.test(values.email.trim())) next.email = "Email không hợp lệ";
        if (!values.message.trim()) next.message = "Vui lòng nhập nội dung liên hệ";
        return next;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        // TODO(Phase 26 follow-up): chưa có backend endpoint nhận liên hệ (không phase
        // nào trong REFACTOR_PLAN.md tạo ContactController) — submit hiện tại chỉ giả
        // lập thành công ở client, chưa gửi email thật cho Admin. Cần 1 phase backend
        // riêng trước khi nối API thật.
        setSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        setSubmitting(false);

        showToast({ tone: "success", message: "Đã gửi liên hệ thành công" });
        setValues(initialValues);
        setErrors({});
    };

    return (
        <div className="bg-background">
            {/* HERO */}
            <section className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-h1 text-primary"
                    >
                        Liên hệ với chúng tôi
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-4 text-body-lg text-secondary max-w-2xl mx-auto"
                    >
                        Có câu hỏi hoặc cần hỗ trợ? Đội ngũ Ademy luôn sẵn sàng
                        lắng nghe và đồng hành cùng bạn.
                    </motion.p>
                </div>
            </section>

            {/* CONTACT CONTENT */}
            <section className="pb-20">
                <div className="mx-auto max-w-3xl px-6 space-y-8">
                    {/* INFO */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card variant="marketing">
                            <h2 className="text-h3 text-primary">
                                Thông tin liên hệ
                            </h2>

                            <p className="mt-3 text-secondary">
                                Nếu bạn cần tư vấn khóa học, hỗ trợ kỹ thuật
                                hoặc hợp tác, hãy liên hệ với chúng tôi qua
                                các kênh sau.
                            </p>

                            <div className="mt-6 space-y-2 text-body text-primary">
                                <div>
                                    <span className="font-medium">Địa chỉ:</span>{" "}
                                    123 Nguyễn Văn Cừ, TP. Hồ Chí Minh
                                </div>
                                <div>
                                    <span className="font-medium">Email:</span>{" "}
                                    support@ademy.edu.vn
                                </div>
                                <div>
                                    <span className="font-medium">Hotline:</span>{" "}
                                    0123 456 789
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* FORM */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card variant="marketing">
                            <h3 className="text-h3 text-primary mb-6">
                                Gửi tin nhắn cho chúng tôi
                            </h3>

                            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                                <FormField label="Họ và tên" required error={errors.fullName}>
                                    <Input
                                        value={values.fullName}
                                        onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
                                        autoComplete="name"
                                    />
                                </FormField>

                                <FormField label="Email" required error={errors.email}>
                                    <Input
                                        type="email"
                                        value={values.email}
                                        onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                                        autoComplete="email"
                                    />
                                </FormField>

                                <FormField label="Nội dung liên hệ" required error={errors.message}>
                                    <Textarea
                                        rows={4}
                                        value={values.message}
                                        onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                                    />
                                </FormField>

                                <Button type="submit" variant="primary" loading={submitting} className="w-full">
                                    Gửi liên hệ
                                </Button>
                            </form>
                        </Card>
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-surface">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto max-w-3xl px-6 text-center"
                >
                    <h2 className="text-h2 text-primary">
                        Sẵn sàng bắt đầu học tập cùng Ademy?
                    </h2>
                    <p className="mt-4 text-secondary">
                        Đăng ký tài khoản để trải nghiệm hệ thống học tập
                        và quản lý khóa học toàn diện.
                    </p>
                    <div className="mt-8">
                        <Button variant="primary" onClick={() => navigate("/signup")}>
                            Đăng ký ngay
                        </Button>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default ContactPage;
