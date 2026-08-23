import type { ReactNode } from "react";
import Card from "./Card";
import Skeleton from "./Skeleton";

interface StatCardProps {
    label: string;
    value?: string | number;
    icon?: ReactNode;
    loading?: boolean;
}

const StatCard = ({ label, value, icon, loading }: StatCardProps) => {
    return (
        <Card variant="app">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-body-sm text-secondary">{label}</p>
                    {loading ? (
                        <Skeleton className="mt-2 h-7 w-14" />
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
