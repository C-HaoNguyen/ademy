import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "cta" | "primary" | "secondary" | "tertiary" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    iconLeft?: LucideIcon;
    iconRight?: LucideIcon;
    children?: ReactNode;
    type?: "button" | "submit";
}

const variantClasses: Record<ButtonVariant, string> = {
    cta: "bg-cta-gradient hover:bg-cta-gradient-hover text-inverse",
    primary:
        "bg-action-primary-bg hover:bg-action-primary-bg-hover active:bg-action-primary-bg-active text-inverse",
    secondary:
        "border border-action-secondary-border text-action-secondary-text hover:bg-action-secondary-bg-hover",
    tertiary: "text-action-tertiary-text hover:bg-action-tertiary-bg-hover",
    danger: "bg-status-danger-text hover:opacity-90 active:opacity-80 text-inverse",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2",
};

const iconSize: Record<ButtonSize, number> = {
    sm: 16,
    md: 18,
    lg: 20,
};

const Button = ({
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    iconLeft: IconLeft,
    iconRight: IconRight,
    children,
    type = "button",
    className = "",
    ...rest
}: ButtonProps) => {
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            className={`inline-flex items-center justify-center rounded-radius-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-action-disabled-bg disabled:text-action-disabled-text disabled:hover:bg-action-disabled-bg ${sizeClasses[size]} ${isDisabled ? "" : variantClasses[variant]} ${className}`}
            {...rest}
        >
            {loading ? (
                <Loader2 size={iconSize[size]} className="animate-spin" />
            ) : (
                IconLeft && <IconLeft size={iconSize[size]} />
            )}
            {children}
            {!loading && IconRight && <IconRight size={iconSize[size]} />}
        </button>
    );
};

export default Button;
