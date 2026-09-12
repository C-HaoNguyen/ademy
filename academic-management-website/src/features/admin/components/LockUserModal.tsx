import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";
import { adminUsersQueryKey, type AdminUser } from "@/shared/api/queries/useAdminUsersQuery";
import { useToast } from "@/shared/ui/useToast";
import Modal from "@/shared/ui/Modal";
import Button from "@/shared/ui/Button";

interface LockUserModalProps {
    open: boolean;
    onClose: () => void;
    user: AdminUser | null;
}

// UI_SPEC §5.2 — action Khóa/Mở khóa cần xác nhận qua Modal (trước đây gọi thẳng API không hỏi lại).
const LockUserModal = ({ open, onClose, user }: LockUserModalProps) => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [submitting, setSubmitting] = useState(false);

    const isLocking = user?.active === true;

    const handleClose = () => {
        if (submitting) return;
        onClose();
    };

    const handleConfirm = async () => {
        if (!user) return;

        const url = isLocking ? API_ENDPOINTS.USERS.LOCK(user.userId) : API_ENDPOINTS.USERS.UNLOCK(user.userId);

        setSubmitting(true);
        try {
            const res = await apiClient(url, { method: "PUT" });

            if (!res.ok) {
                const message = await res.text().catch(() => "");
                showToast({ tone: "danger", message: message || "Thao tác thất bại" });
                return;
            }

            showToast({
                tone: "success",
                message: isLocking ? `Đã khóa tài khoản ${user.fullName}` : `Đã mở khóa tài khoản ${user.fullName}`,
            });
            queryClient.invalidateQueries({ queryKey: adminUsersQueryKey });
            handleClose();
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={isLocking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
            size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={handleClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button
                        variant={isLocking ? "danger" : "primary"}
                        onClick={handleConfirm}
                        loading={submitting}
                    >
                        {isLocking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                    </Button>
                </>
            }
        >
            <p className="text-body text-secondary">
                {isLocking ? (
                    <>
                        Khóa tài khoản <span className="font-semibold text-primary">{user?.fullName}</span>? Người
                        dùng sẽ không thể đăng nhập cho tới khi được mở khóa lại.
                    </>
                ) : (
                    <>
                        Mở khóa tài khoản <span className="font-semibold text-primary">{user?.fullName}</span>?
                    </>
                )}
            </p>
        </Modal>
    );
};

export default LockUserModal;
