import { useMemo, useState } from "react";
import { Users as UsersIcon, UserPlus, Lock, Unlock, AlertTriangle } from "lucide-react";
import { useAdminUsersQuery, type AdminUser } from "@/shared/api/queries/useAdminUsersQuery";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn } from "@/shared/ui/Table";
import UserFormOverlay from "@/features/admin/components/UserFormOverlay";
import LockUserModal from "@/features/admin/components/LockUserModal";

type RoleFilter = "ALL" | "STUDENT" | "TEACHER" | "ADMIN";

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
    { key: "ALL", label: "Tất cả" },
    { key: "STUDENT", label: "Student" },
    { key: "TEACHER", label: "Teacher" },
    { key: "ADMIN", label: "Admin" },
];

const AdminUsersList = () => {
    const usersQuery = useAdminUsersQuery();

    const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
    const [showInviteOverlay, setShowInviteOverlay] = useState(false);
    const [lockingUser, setLockingUser] = useState<AdminUser | null>(null);

    const filteredUsers = useMemo(() => {
        const sorted = [...(usersQuery.data ?? [])].sort((a, b) => a.userId - b.userId);
        if (roleFilter === "ALL") return sorted;
        return sorted.filter((u) => u.role === roleFilter);
    }, [usersQuery.data, roleFilter]);

    const columns: TableColumn<AdminUser>[] = [
        {
            key: "fullName",
            header: "Tên",
            render: (user) => <span className="font-medium text-primary">{user.fullName}</span>,
        },
        {
            key: "email",
            header: "Email",
            render: (user) => user.email,
        },
        {
            key: "role",
            header: "Role",
            render: (user) => (
                <Badge variant="status" tone="info">
                    {user.role}
                </Badge>
            ),
        },
        {
            key: "active",
            header: "Trạng thái",
            render: (user) => (
                <Badge variant="status" tone={user.active ? "success" : "danger"}>
                    {user.active ? "Active" : "Locked"}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: "Ngày tạo",
            render: (user) => new Date(user.createdAt).toLocaleDateString("vi-VN"),
        },
        {
            key: "actions",
            header: "Action",
            render: (user) => (
                <Button
                    variant={user.active ? "danger" : "secondary"}
                    size="sm"
                    iconLeft={user.active ? Lock : Unlock}
                    onClick={(e) => {
                        e.stopPropagation();
                        setLockingUser(user);
                    }}
                    aria-label={user.active ? `Khóa tài khoản ${user.fullName}` : `Mở khóa tài khoản ${user.fullName}`}
                >
                    {user.active ? "Khóa" : "Mở khóa"}
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="flex items-center gap-3 text-h2 text-primary">
                        <UsersIcon size={24} aria-hidden="true" />
                        Quản lý người dùng
                    </h2>
                    <p className="text-body-sm text-secondary mt-1">
                        Xem toàn bộ tài khoản trên nền tảng, khóa/mở khóa hoặc mời Teacher mới.
                    </p>
                </div>
                <Button variant="primary" iconLeft={UserPlus} onClick={() => setShowInviteOverlay(true)}>
                    Mời Teacher
                </Button>
            </div>

            <div className="flex items-center gap-2">
                {ROLE_FILTERS.map((filter) => (
                    <Button
                        key={filter.key}
                        variant={roleFilter === filter.key ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setRoleFilter(filter.key)}
                    >
                        {filter.label}
                    </Button>
                ))}
            </div>

            {usersQuery.isError ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="Không thể tải danh sách user"
                    description="Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
                    action={
                        <Button variant="primary" size="sm" onClick={() => usersQuery.refetch()}>
                            Thử lại
                        </Button>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    data={filteredUsers}
                    rowKey={(user) => user.userId}
                    loading={usersQuery.isLoading}
                    emptyState={<EmptyState icon={UsersIcon} title="Không có user nào phù hợp" />}
                />
            )}

            <UserFormOverlay open={showInviteOverlay} onClose={() => setShowInviteOverlay(false)} />

            <LockUserModal open={lockingUser !== null} onClose={() => setLockingUser(null)} user={lockingUser} />
        </div>
    );
};

export default AdminUsersList;
