import type { ReactNode } from "react";

type CardVariant = "marketing" | "app";

interface CardProps {
    variant?: CardVariant;
    padding?: string;
    children: ReactNode;
    className?: string;
}

const variantClasses: Record<CardVariant, string> = {
    marketing: "shadow-soft",
    app: "border border-default shadow-none",
};

const defaultPadding: Record<CardVariant, string> = {
    marketing: "p-6",
    app: "p-4",
};

const Card = ({ variant = "app", padding, children, className = "" }: CardProps) => {
    return (
        <div
            className={`rounded-radius-lg bg-surface ${variantClasses[variant]} ${
                padding ?? defaultPadding[variant]
            } ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
