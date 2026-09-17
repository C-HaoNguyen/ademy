import { useMemo, useState } from "react";
import { Users as UsersIcon, UserPlus, Lock, Unlock, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAdminUsersQuery, type AdminUser } from "@/shared/api/queries/useAdminUsersQuery";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import Table, { type TableColumn } from "@/shared/ui/Table";
import UserFormOverlay from "@/features/admin/components/UserFormOverlay";
import LockUserModal from "@/features/admin/components/LockUserModal";

type RoleFilter = "ALL" | "STUDENT" | "TEACHER" | "ADMIN";

const AdminUsersList = () => {
    const { t } = useTranslation("admin");
    const usersQuery = useAdminUsersQuery();

    const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
        { key: "ALL", label: t("users.filterAll") },
        { key: "STUDENT", label: t("users.filterStudent") },
        { key: "TEACHER", label: t("users.filterTeacher") },
        { key: "ADMIN", label: t("users.filterAdmin") },
    ];

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
            header: t("users.columnName"),
            render: (user) => <span className="font-medium text-primary">{user.fullName}</span>,
        },
        {
            key: "email",
            header: t("users.columnEmail"),
            render: (user) => user.email,
        },
        {
            key: "role",
            header: t("users.columnRole"),
            render: (user) => (
                <Badge variant="status" tone="info">
                    {user.role}
                </Badge>
            ),
        },
        {
            key: "active",
            header: t("users.columnStatus"),
            render: (user) => (
                <Badge variant="status" tone={user.active ? "success" : "danger"}>
                    {user.active ? t("users.statusActive") : t("users.statusLocked")}
                </Badge>
            ),
        },
        {
            key: "createdAt",
            header: t("users.columnCreatedAt"),
            render: (user) => new Date(user.createdAt).toLocaleDateString("vi-VN"),
        },
        {
            key: "actions",
            header: t("users.columnActions"),
            render: (user) => (
                <Button
                    variant={user.active ? "danger" : "secondary"}
                    size="sm"
                    iconLeft={user.active ? Lock : Unlock}
                    onClick={(e) => {
                        e.stopPropagation();
                        setLockingUser(user);
                    }}
                    aria-label={user.active ? t("users.lockAria", { fullName: user.fullName }) : t("users.unlockAria", { fullName: user.fullName })}
                >
                    {user.active ? t("users.lock") : t("users.unlock")}
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
                        {t("users.title")}
                    </h2>
                    <p className="text-body-sm text-secondary mt-1">
                        {t("users.subtitle")}
                    </p>
                </div>
                <Button variant="primary" iconLeft={UserPlus} onClick={() => setShowInviteOverlay(true)}>
                    {t("users.inviteTeacher")}
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
                    title={t("users.loadErrorTitle")}
                    description={t("users.loadErrorDescription")}
                    action={
                        <Button variant="primary" size="sm" onClick={() => usersQuery.refetch()}>
                            {t("users.retry")}
                        </Button>
                    }
                />
            ) : (
                <Table
                    columns={columns}
                    data={filteredUsers}
                    rowKey={(user) => user.userId}
                    loading={usersQuery.isLoading}
                    emptyState={<EmptyState icon={UsersIcon} title={t("users.emptyTitle")} />}
                />
            )}

            <UserFormOverlay open={showInviteOverlay} onClose={() => setShowInviteOverlay(false)} />

            <LockUserModal open={lockingUser !== null} onClose={() => setLockingUser(null)} user={lockingUser} />
        </div>
    );
};

export default AdminUsersList;
