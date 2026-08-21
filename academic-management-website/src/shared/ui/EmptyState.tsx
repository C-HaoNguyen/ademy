import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-card border border-dashed border-slate-200 bg-white">
            <div className="w-12 h-12 rounded-full bg-legacy-surface flex items-center justify-center text-legacy-primary mb-4">
                <Icon size={22} />
            </div>
            <h3 className="text-base font-semibold text-legacy-ink">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
};

export default EmptyState;
