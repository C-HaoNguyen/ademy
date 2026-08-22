import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
}

const Textarea = ({ hasError = false, className = "", ...rest }: TextareaProps) => {
    return (
        <textarea
            className={`w-full rounded-radius-md border bg-surface-muted px-3 py-2 text-body text-primary placeholder:text-placeholder transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:text-disabled disabled:cursor-not-allowed disabled:opacity-60 ${
                hasError ? "border-danger" : "border-transparent focus:border-brand"
            } ${className}`}
            {...rest}
        />
    );
};

export default Textarea;
