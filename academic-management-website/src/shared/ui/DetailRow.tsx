import type { ReactNode } from "react";

interface DetailRowProps {
    label: string;
    value: ReactNode;
}

const DetailRow = ({ label, value }: DetailRowProps) => (
    <div className="flex items-center justify-between py-2 border-b border-default last:border-b-0">
        <span className="text-body-sm text-secondary">{label}</span>
        <span className="text-body-sm font-medium text-primary">{value}</span>
    </div>
);

export default DetailRow;
