import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient, readErrorMessage } from "@/shared/api/client";
import { adminUsersQueryKey } from "@/shared/api/queries/useAdminUsersQuery";
import { useToast } from "@/shared/ui/useToast";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";
import FormField from "@/shared/ui/FormField";
import Input from "@/shared/ui/Input";

interface UserFormOverlayProps {
    open: boolean;
    onClose: () => void;
}

type InviteTeacherForm = {
    username: string;
    fullName: string;
    email: string;
    password: string;
};

const emptyForm: InviteTeacherForm = { username: "", fullName: "", email: "", password: "" };

// UI_SPEC §5.2 — Button "Mời Teacher" chỉ tạo tài khoản Teacher (BR-002), không phải nút "Thêm
// user" chung cho mọi role như trước.
const UserFormOverlay = ({ open, onClose }: UserFormOverlayProps) => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState<InviteTeacherForm>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof InviteTeacherForm, string>>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm(emptyForm);
        setErrors({});
    }, [open]);

    const validate = (): boolean => {
        const nextErrors: Partial<Record<keyof InviteTeacherForm, string>> = {};
        if (!form.username.trim()) nextErrors.username = "Vui lòng nhập tên đăng nhập";
        if (!form.fullName.trim()) nextErrors.fullName = "Vui lòng nhập họ và tên";
        if (!form.email.trim()) nextErrors.email = "Vui lòng nhập email";
        if (!form.password.trim()) nextErrors.password = "Vui lòng nhập mật khẩu";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);
        try {
            const res = await apiClient(API_ENDPOINTS.USERS.INVITE_TEACHER, {
                method: "POST",
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const message = await readErrorMessage(res, "Mời Teacher thất bại");
                showToast({ tone: "danger", message });
                return;
            }

            showToast({ tone: "success", message: "Đã mời Teacher thành công" });
            queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
            onClose();
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeDisabled={submitting}
            title="Mời Teacher"
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                        Mời Teacher
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <FormField label="Tên đăng nhập" required error={errors.username}>
                    <Input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="VD: nguyenvana"
                    />
                </FormField>
                <FormField label="Họ và tên" required error={errors.fullName}>
                    <Input
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="VD: Nguyễn Văn A"
                    />
                </FormField>
                <FormField label="Email" required error={errors.email}>
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@example.com"
                    />
                </FormField>
                <FormField label="Mật khẩu" required error={errors.password}>
                    <Input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                    />
                </FormField>
            </div>
        </Modal>
    );
};

export default UserFormOverlay;
