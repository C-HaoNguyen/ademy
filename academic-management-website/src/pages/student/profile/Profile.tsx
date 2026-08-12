import { useEffect, useState } from "react";
import { type UserProfile } from "../../../types/User";
import InfoItem from "../../../components/student/InfoItem";
import Badge from "../../../components/common/Badge";
import Toast from "../../../components/common/Toast";
import { API_URL } from "@/config/constants";

const Profile = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
    type ToastType = "success" | "error";

    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
    } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                });

                if (!res.ok) throw new Error("Fetch failed");

                const data: UserProfile = await res.json();
                setUser(data);
                setOriginalUser(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="p-10">Loading...</div>;
    if (!user) return <div>Không có dữ liệu</div>;

    const handleSave = async () => {
        if (!user) return;

        try {
            const res = await fetch(`${API_URL}/users/me/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: JSON.stringify({
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // backend throw RuntimeException → message nằm ở đây
                setToast({
                    type: "error",
                    message: data.message || "Cập nhật thất bại",
                });
                return;
            }

            setUser(data);
            setOriginalUser(data);
            setIsEditing(false);

            setToast({
                type: "success",
                message: "Cập nhật thông tin thành công!",
            });

            // tự ẩn sau 3s
            setTimeout(() => setToast(null), 3000);
        } catch (error) {
            setToast({
                type: "error",
                message: "Lỗi kết nối server",
            });

            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="mx-auto bg-white rounded-3xl shadow-xl p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <img
                        src={user.avatarUrl || "https://cdn-icons-png.flaticon.com/512/8188/8188362.png"}
                        className="w-32 h-32 rounded-full ring-4 ring-blue-400"
                    />

                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{user.fullName}</h1>
                        <p className="text-gray-500">@{user.username}</p>

                        <div className="flex gap-3 mt-3">
                            <Badge text={user.role} />
                            <Badge
                                text={user.status}
                                color={user.status === "ACTIVE" ? "green" : "red"}
                            />
                        </div>
                    </div>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-6 py-2 rounded-xl bg-blue-600 text-white"
                        >
                            Chỉnh sửa
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setUser(originalUser);
                                    setIsEditing(false);
                                }}
                                className="px-6 py-2 rounded-xl bg-gray-200 text-gray-800"
                            >
                                Hủy
                            </button>

                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-xl bg-emerald-600 text-white"
                            >
                                Lưu
                            </button>
                        </div>
                    )}
                </div>

                <div className="my-8 h-px bg-gray-200" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem
                        label="Email"
                        value={user.email}
                        editable={isEditing}
                        onChange={(value) =>
                            setUser({ ...user, email: value })
                        }
                    />
                    <InfoItem
                        label="Họ và tên"
                        value={user.fullName}
                        editable={isEditing}
                        onChange={(value) =>
                            setUser({ ...user, fullName: value })
                        }
                    />
                    <InfoItem
                        label="Username"
                        value={user.username}
                        editable={isEditing}
                        onChange={(value) =>
                            setUser({ ...user, username: value })
                        }
                    />
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default Profile;