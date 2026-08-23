import { useRef, type KeyboardEvent, type ReactNode } from "react";

export interface RadioCardOption {
    value: string;
    label: string;
    icon?: ReactNode;
}

interface RadioCardGroupProps {
    options: RadioCardOption[];
    value: string;
    onChange: (value: string) => void;
    name: string;
    disabled?: boolean;
}

const RadioCardGroup = ({ options, value, onChange, name, disabled }: RadioCardGroupProps) => {
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const hasSelection = options.some((option) => option.value === value);

    const moveFocus = (currentIndex: number, delta: 1 | -1) => {
        if (options.length === 0) return;
        const nextIndex = (currentIndex + delta + options.length) % options.length;
        optionRefs.current[nextIndex]?.focus();
        onChange(options[nextIndex].value);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (disabled) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            moveFocus(index, 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            moveFocus(index, -1);
        }
    };

    return (
        <div role="radiogroup" aria-label={name} className="flex flex-col gap-3">
            {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                    <button
                        key={option.value}
                        ref={(el) => {
                            optionRefs.current[index] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={disabled}
                        tabIndex={isSelected || (!hasSelection && index === 0) ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={`flex items-center gap-3 rounded-radius-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            isSelected
                                ? "border-brand bg-nav-selected-bg text-nav-selected-text"
                                : "border-default bg-surface text-primary hover:bg-surface-muted"
                        }`}
                    >
                        {option.icon && <span className="shrink-0">{option.icon}</span>}
                        <span className="text-body-sm font-medium">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default RadioCardGroup;
