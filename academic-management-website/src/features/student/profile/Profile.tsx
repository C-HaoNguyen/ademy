import { useEffect, useState } from "react";
import { type UserProfile } from "../../../types/User";
import Badge from "../../../shared/ui/Badge";
import Card from "../../../shared/ui/Card";
import FormField from "../../../shared/ui/FormField";
import Input from "../../../shared/ui/Input";
import Button from "../../../shared/ui/Button";
import { SkeletonText } from "../../../shared/ui/Skeleton";
import { useToast } from "../../../shared/ui/useToast";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

const Profile = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient(API_ENDPOINTS.USERS.ME);

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

    if (loading) {
        return (
            <Card variant="app">
                <SkeletonText lines={5} />
            </Card>
        );
    }

    if (!user) return <div className="text-body text-secondary">Không có dữ liệu</div>;

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const res = await apiClient(API_ENDPOINTS.USERS.UPDATE_ME, {
                method: "PUT",
                body: JSON.stringify({
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // backend throw RuntimeException → message nằm ở đây
                showToast({ tone: "danger", message: data.message || "Cập nhật thất bại" });
                return;
            }

            setUser(data);
            setOriginalUser(data);
            setIsEditing(false);
            showToast({ tone: "success", message: "Đã lưu thay đổi" });
        } catch {
            showToast({ tone: "danger", message: "Lỗi kết nối server" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card variant="app">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <img
                    src={user.avatarUrl || "https://cdn-icons-png.flaticon.com/512/8188/8188362.png"}
                    alt={`Ảnh đại diện của ${user.fullName}`}
                    className="w-32 h-32 rounded-full ring-4 ring-focus object-cover"
                />

                <div className="flex-1">
                    <h1 className="text-h1 text-primary">{user.fullName}</h1>
                    <p className="text-secondary">@{user.username}</p>

                    <div className="flex gap-3 mt-3">
                        <Badge variant="neutral">{user.role}</Badge>
                        <Badge variant="status" tone={user.status === "ACTIVE" ? "success" : "danger"}>
                            {user.status}
                        </Badge>
                    </div>
                </div>

                {!isEditing ? (
                    <Button variant="primary" onClick={() => setIsEditing(true)}>
                        Chỉnh sửa
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setUser(originalUser);
                                setIsEditing(false);
                            }}
                        >
                            Hủy
                        </Button>

                        <Button variant="primary" loading={saving} onClick={handleSave}>
                            Lưu thay đổi
                        </Button>
                    </div>
                )}
            </div>

            <div className="my-8 border-t border-default" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Email">
                    <Input
                        value={user.email}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                    />
                </FormField>
                <FormField label="Họ và tên">
                    <Input
                        value={user.fullName}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                    />
                </FormField>
                <FormField label="Username">
                    <Input
                        value={user.username}
                        disabled={!isEditing}
                        onChange={(e) => setUser({ ...user, username: e.target.value })}
                    />
                </FormField>
            </div>
        </Card>
    );
};

export default Profile;
