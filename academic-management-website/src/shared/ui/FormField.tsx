import { cloneElement, useId } from "react";
import type { ReactElement } from "react";

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    helperText?: string;
    children: ReactElement<{
        id?: string;
        "aria-describedby"?: string;
        hasError?: boolean;
        required?: boolean;
    }>;
}

const FormField = ({ label, required = false, error, helperText, children }: FormFieldProps) => {
    const generatedId = useId();
    const controlId = children.props.id ?? generatedId;
    const descriptionId = error || helperText ? `${controlId}-description` : undefined;

    const control = cloneElement(children, {
        id: controlId,
        "aria-describedby": descriptionId,
        hasError: Boolean(error),
        required,
    });

    return (
        <div>
            <label htmlFor={controlId} className="mb-1 block text-body-sm font-medium text-secondary">
                {label}
                {required && <span className="ml-0.5 text-status-danger-text">*</span>}
            </label>
            {control}
            {(error || helperText) && (
                <p
                    id={descriptionId}
                    className={`mt-1 text-caption ${error ? "text-status-danger-text" : "text-tertiary"}`}
                >
                    {error || helperText}
                </p>
            )}
        </div>
    );
};

export default FormField;
