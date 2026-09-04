import type { ReactNode } from "react";
import Card from "./Card";
import Skeleton from "./Skeleton";

interface StatCardProps {
    label: string;
    value?: string | number;
    icon?: ReactNode;
    loading?: boolean;
    // Số liệu chưa có nguồn dữ liệu thật (chờ phase sau) — hiện text này thay cho value,
    // không phải trạng thái loading/lỗi.
    pendingText?: string;
}

const StatCard = ({ label, value, icon, loading, pendingText }: StatCardProps) => {
    return (
        <Card variant="app">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-body-sm text-secondary">{label}</p>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-14" />
                    ) : pendingText ? (
                        <p className="text-caption font-medium text-tertiary mt-2 inline-block px-2 py-1 rounded-radius-full bg-surface-muted">
                            {pendingText}
                        </p>
                    ) : (
                        <p className="text-h2 text-primary mt-1">{value}</p>
                    )}
                </div>
                {icon && (
                    <div className="p-3 rounded-radius-lg bg-surface-brand-muted text-brand shrink-0">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default StatCard;
