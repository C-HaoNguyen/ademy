import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

const Input = ({ hasError = false, className = "", ...rest }: InputProps) => {
    return (
        <input
            className={`h-10 w-full rounded-radius-md border bg-surface-muted px-3 text-body text-primary placeholder:text-placeholder transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:text-disabled disabled:cursor-not-allowed disabled:opacity-60 ${
                hasError ? "border-danger" : "border-transparent focus:border-brand"
            } ${className}`}
            {...rest}
        />
    );
};

export default Input;
