import type { ReactNode } from "react";

type BadgeVariant = "status" | "neutral";
type BadgeTone = "success" | "warning" | "danger" | "info";

interface BadgeProps {
    variant?: BadgeVariant;
    tone?: BadgeTone;
    children: ReactNode;
}

const toneClasses: Record<BadgeTone, string> = {
    success: "bg-status-success-bg text-status-success-text",
    warning: "bg-status-warning-bg text-status-warning-text",
    danger: "bg-status-danger-bg text-status-danger-text",
    info: "bg-status-info-bg text-status-info-text",
};

const Badge = ({ variant = "status", tone = "info", children }: BadgeProps) => {
    const colorClasses = variant === "neutral" ? "bg-surface-brand-muted text-brand" : toneClasses[tone];

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-radius-full text-xs font-medium ${colorClasses}`}>
            {children}
        </span>
    );
};

export default Badge;
