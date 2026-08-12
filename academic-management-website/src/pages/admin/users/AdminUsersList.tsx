import { User, Pencil, Plus, UserX, UserCheck, Users as UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getAccessToken } from "../../../utils/AuthUtils";
import CreateUser from "../../../components/admin/AddUserOverlay";
import EditUserOverlay from "../../../components/admin/EditUserOverlay";
import { API_URL } from "@/config/constants";
import { SkeletonTable } from "@/components/common/Skeleton";
import EmptyState from "@/components/common/EmptyState";
import Toast from "@/components/common/Toast";

type AdminUser = {
    userId: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    active: boolean;
};

const AdminUsersList = () => {
    const [showOverlayAddUser, setShowOverlayAddUser] = useState(false);
    const [showOverlayDeleteUser, setShowOverlayDeleteUser] = useState(false);
    const [showOverlayEditUser, setShowOverlayEditUser] = useState(false);

    const [newUser, setNewUser] = useState({
        username: "",
        fullName: "",
        email: "",
        password: "",
        role: "STUDENT",
        active: true,
    });

    const [editUser, setEditUser] = useState({
        fullName: "",
        email: "",
        role: "STUDENT",
    });
    const [editUserId, setEditUserId] = useState<number | null>(null);

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const [deletedUser, setDeletedUser] = useState<{
        userId: number;
        username: string
    } | null>(null);

    useEffect(() => {
        refreshUsersList();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    async function refreshUsersList() {
        setLoading(true);
        try {
            const token = getAccessToken();

            const res = await fetch(`${API_URL}/admin/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                console.error("API error:", res.status);
                return;
            }

            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleUser(user: AdminUser) {
        const token = getAccessToken();

        const url = user.active
            ? `/admin/users/${user.userId}/lock`
            : `/admin/users/${user.userId}/unlock`;

        try {
            const res = await fetch(`${API_URL}${url}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const message = await res.text();
                setToast({ message: message || "Thao tác thất bại", type: "error" });
                return;
            }

            refreshUsersList();
        } catch (err) {
            console.error(err);
            setToast({ message: "Thao tác thất bại", type: "error" });
        }
    }

    const handleDeleteUser = async () => {
        if (!deletedUser) return;

        try {
            const token = getAccessToken();

            const res = await fetch(
                `${API_URL}/admin/deleted-user`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        userId: deletedUser.userId,
                    }),
                }
            );

            if (!res.ok) {
                console.error("Delete failed:", res.status);
                setToast({ message: "Xóa người dùng thất bại", type: "error" });
                return;
            }

            setShowOverlayDeleteUser(false);
            setDeletedUser(null);
            setToast({ message: "Đã xóa người dùng", type: "success" });

            refreshUsersList();
        } catch (err) {
            console.error(err);
            setToast({ message: "Xóa người dùng thất bại", type: "error" });
        }
    };

    const handleCreateUser = async () => {
        try {
            const token = getAccessToken();

            const res = await fetch(`${API_URL}/admin/users/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newUser),
            });

            if (!res.ok) {
                const message = await res.text();
                setToast({ message: message || "Tạo người dùng thất bại", type: "error" });
                return;
            }

            setShowOverlayAddUser(false);
            setNewUser({
                username: "",
                fullName: "",
                email: "",
                password: "",
                role: "STUDENT",
                active: true,
            });
            setToast({ message: "Đã tạo người dùng mới", type: "success" });
            refreshUsersList();
        } catch (err) {
            console.error(err);
            setToast({ message: "Tạo người dùng thất bại", type: "error" });
        }
    };

    const handleEditUser = (user: AdminUser) => {
        setEditUserId(user.userId);
        setEditUser({
            fullName: user.fullName,
            email: user.email,
            role: user.role,
        });
        setShowOverlayEditUser(true);
    };

    const handleSubmitEditUser = async () => {
        if (!editUserId) return;

        try {
            const token = getAccessToken();

            const res = await fetch(`${API_URL}/admin/users/${editUserId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editUser),
            });

            if (!res.ok) {
                const message = await res.text();
                setToast({ message: message || "Cập nhật người dùng thất bại", type: "error" });
                return;
            }

            setShowOverlayEditUser(false);
            setEditUserId(null);
            setToast({ message: "Đã cập nhật người dùng", type: "success" });
            refreshUsersList();
        } catch (err) {
            console.error(err);
            setToast({ message: "Cập nhật người dùng thất bại", type: "error" });
        }
    };

    return (
        <div>
            <h2 className="flex items-center text-2xl text-primary font-semibold mb-4 gap-3">
                <User size={24} aria-hidden="true" />
                Quản lý người dùng
            </h2>

            <CreateUser
                show={showOverlayAddUser}
                newUser={newUser}
                setNewUser={setNewUser}
                onClose={() => setShowOverlayAddUser(false)}
                onSubmit={handleCreateUser}
            />

            <EditUserOverlay
                show={showOverlayEditUser}
                editUser={editUser}
                setEditUser={setEditUser}
                onClose={() => setShowOverlayEditUser(false)}
                onSubmit={handleSubmitEditUser}
            />

            {
                showOverlayDeleteUser && deletedUser && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-overlayFade">
                        <div className="bg-white rounded-card shadow-xl w-[440px] p-6 animate-modalPop">
                            {/* Header */}
                            <h2 className="text-2xl font-semibold text-danger mb-3">
                                Xóa người dùng
                            </h2>

                            {/* Content */}
                            <p className="text-slate-700 leading-relaxed mb-6">
                                Bạn sắp xóa người dùng{" "}
                                <span className="font-semibold text-danger">
                                    {deletedUser.username}
                                </span>
                                .
                                <br />
                                <span className="text-sm text-slate-500">
                                    Hành động này sẽ <b>không thể hoàn tác</b>. Bạn có chắc chắn muốn tiếp tục?
                                </span>
                            </p>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowOverlayDeleteUser(false)}
                                    className="cursor-pointer px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDeleteUser}
                                    className="cursor-pointer px-5 py-2.5 rounded-lg bg-danger text-white hover:bg-red-700 transition-colors duration-200"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="flex items-center justify-start mb-4">
                <button
                    type="button"
                    onClick={() => setShowOverlayAddUser(true)}
                    className="cursor-pointer group flex items-center gap-2 px-3 py-2 rounded-xl bg-cta
                                text-white text-sm font-semibold shadow-sm hover:bg-cta-dark hover:shadow-md
                                transition-all duration-200"
                >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors duration-200">
                        <Plus size={16} aria-hidden="true" />
                    </span>
                    Thêm người dùng
                </button>
            </div>

            <div className="bg-white rounded-card shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-sm">
                        <colgroup>
                            <col className="w-16" />
                            <col className="w-48" />
                            <col className="w-40" />
                            <col className="w-1/3" />
                            <col className="w-32" />
                            <col className="w-32" />
                            <col className="w-40" />
                            <col className="w-32" /> {/* Action */}
                        </colgroup>

                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-center text-slate-600">
                                <th className="px-4 py-3 font-medium">ID</th>
                                <th className="px-4 py-3 font-medium">Họ và tên</th>
                                <th className="px-4 py-3 font-medium">Tên người dùng</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Quyền</th>
                                <th className="px-4 py-3 font-medium">Trạng thái</th>
                                <th className="px-4 py-3 font-medium">Ngày tạo tài khoản</th>
                                <th className="px-4 py-3 font-medium">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <SkeletonTable rows={6} columns={8} />
                            ) : (
                                [...users]
                                    .sort((a, b) => a.userId - b.userId)
                                    .map((user) => (
                                        <tr
                                            key={user.userId}
                                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200"
                                        >
                                            <td className="text-center px-4 py-3">{user.userId}</td>
                                            <td className="text-center px-4 py-3 truncate">
                                                {user.fullName}
                                            </td>
                                            <td className="text-center px-4 py-3 truncate">
                                                {user.username}
                                            </td>
                                            <td className="text-center px-4 py-3 truncate">
                                                {user.email}
                                            </td>
                                            <td className="text-center px-4 py-3">
                                                <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="text-center px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${user.active
                                                        ? "bg-success-light text-success"
                                                        : "bg-danger-light text-danger"
                                                        }`}
                                                >
                                                    {user.active ? "Active" : "Locked"}
                                                </span>
                                            </td>
                                            <td className="text-center px-4 py-3 text-slate-500">
                                                {user.createdAt}
                                            </td>

                                            {/* Action */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditUser(user)}
                                                        className="cursor-pointer p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors duration-200"
                                                        title="Sửa người dùng"
                                                        aria-label="Sửa người dùng"
                                                    >
                                                        <Pencil size={16} aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleUser(user)}
                                                        className={`cursor-pointer p-2 rounded-lg transition-colors duration-200 ${user.active
                                                            ? "text-danger hover:bg-danger-light"
                                                            : "text-success hover:bg-success-light"
                                                            }`}
                                                        title={user.active ? "Vô hiệu hóa" : "Mở khóa"}
                                                        aria-label={user.active ? "Vô hiệu hóa" : "Mở khóa"}
                                                    >
                                                        {user.active ? <UserX size={16} aria-hidden="true" /> : <UserCheck size={16} aria-hidden="true" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>

                    {!loading && users.length === 0 && (
                        <div className="p-8">
                            <EmptyState
                                icon={UsersIcon}
                                title="Chưa có người dùng nào"
                                description="Thêm người dùng đầu tiên để bắt đầu quản lý hệ thống."
                            />
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default AdminUsersList;
