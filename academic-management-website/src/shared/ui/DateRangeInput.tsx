import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

interface DateRange {
    from: Date | null;
    to: Date | null;
}

interface DateRangeInputProps {
    value: DateRange;
    onChange: (value: DateRange) => void;
    placeholder?: string;
    id?: string;
    "aria-describedby"?: string;
    hasError?: boolean;
    required?: boolean;
}

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const formatDate = (date: Date | null) => {
    if (!date) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${date.getFullYear()}`;
};

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const buildMonthGrid = (monthAnchor: Date): (Date | null)[] => {
    const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    // JS getDay(): 0=Sun..6=Sat — shift to Monday-first (0=Mon..6=Sun) to match WEEKDAY_LABELS.
    const leadingBlanks = (first.getDay() + 6) % 7;
    const cells: (Date | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
        cells.push(new Date(first.getFullYear(), first.getMonth(), day));
    }
    return cells;
};

const DateRangeInput = ({
    value,
    onChange,
    placeholder = "Chọn khoảng thời gian",
    id,
    "aria-describedby": ariaDescribedBy,
    hasError = false,
    required = false,
}: DateRangeInputProps) => {
    const [open, setOpen] = useState(false);
    const [monthAnchor, setMonthAnchor] = useState(() => value.from ?? new Date());
    const [focusedDate, setFocusedDate] = useState(() => value.from ?? new Date());
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());
    const wasOpenRef = useRef(false);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    // Re-sync the visible month/focused day from the controlled `value` every time the
    // popover opens — otherwise an external reset of `value` (e.g. a "Clear filters"
    // button) while the popover is closed leaves the calendar showing stale state.
    // Return focus to the trigger when the popover closes (click-outside/Escape/selection
    // complete) so keyboard users don't lose their place on the page.
    useEffect(() => {
        if (open) {
            const anchor = value.from ?? new Date();
            setMonthAnchor(anchor);
            setFocusedDate(anchor);
        } else if (wasOpenRef.current) {
            triggerRef.current?.focus();
        }
        wasOpenRef.current = open;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only resync on open/close transitions, not on every `value.from` change while open (would fight in-progress keyboard navigation)
    }, [open]);

    // Only re-focus the active day when it actually changes (keyboard nav / month change),
    // not on every unrelated re-render — a ref-callback-driven `.focus()` would otherwise
    // steal focus back into the popover even after the user tabbed away from it.
    useEffect(() => {
        if (!open) return;
        dayButtonRefs.current.get(focusedDate.toDateString())?.focus();
    }, [open, focusedDate]);

    const grid = useMemo(() => buildMonthGrid(monthAnchor), [monthAnchor]);

    const changeMonth = (delta: number) => {
        const targetFirst = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + delta, 1);
        const daysInTargetMonth = new Date(targetFirst.getFullYear(), targetFirst.getMonth() + 1, 0).getDate();
        const clampedDay = Math.min(focusedDate.getDate(), daysInTargetMonth);
        setMonthAnchor(targetFirst);
        setFocusedDate(new Date(targetFirst.getFullYear(), targetFirst.getMonth(), clampedDay));
    };

    const selectDay = (day: Date) => {
        if (!value.from || value.to) {
            onChange({ from: day, to: null });
            return;
        }
        if (day < value.from) {
            onChange({ from: day, to: value.from });
            setOpen(false);
            return;
        }
        onChange({ from: value.from, to: day });
        setOpen(false);
    };

    const moveFocus = (deltaDays: number) => {
        const next = new Date(focusedDate);
        next.setDate(next.getDate() + deltaDays);
        setFocusedDate(next);
        setMonthAnchor(next);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case "ArrowLeft":
                event.preventDefault();
                moveFocus(-1);
                break;
            case "ArrowRight":
                event.preventDefault();
                moveFocus(1);
                break;
            case "ArrowUp":
                event.preventDefault();
                moveFocus(-7);
                break;
            case "ArrowDown":
                event.preventDefault();
                moveFocus(7);
                break;
            case "Enter":
                event.preventDefault();
                selectDay(focusedDate);
                break;
            case "Escape":
                event.preventDefault();
                setOpen(false);
                break;
        }
    };

    const displayText = value.from || value.to ? `${formatDate(value.from)} – ${formatDate(value.to)}` : "";

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                ref={triggerRef}
                id={id}
                aria-describedby={ariaDescribedBy}
                aria-required={required || undefined}
                onClick={() => setOpen((prev) => !prev)}
                className={`flex h-10 w-full items-center justify-between rounded-radius-md border bg-surface-muted px-3 text-body transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 ${
                    hasError ? "border-danger" : "border-transparent focus:border-brand"
                }`}
            >
                <span className={displayText ? "text-primary" : "text-placeholder"}>
                    {displayText || placeholder}
                </span>
                <CalendarIcon size={16} className="text-tertiary" aria-hidden="true" />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Chọn khoảng ngày"
                    onKeyDown={handleKeyDown}
                    className="absolute z-dropdown mt-2 w-72 rounded-radius-md bg-surface p-3 shadow-elevated"
                >
                    <div className="mb-2 flex items-center justify-between">
                        <button
                            type="button"
                            aria-label="Tháng trước"
                            onClick={() => changeMonth(-1)}
                            className="rounded-radius-sm px-2 py-1 text-body-sm text-secondary hover:bg-surface-muted"
                        >
                            ‹
                        </button>
                        <span className="text-body-sm font-medium text-primary">
                            {monthAnchor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                        </span>
                        <button
                            type="button"
                            aria-label="Tháng sau"
                            onClick={() => changeMonth(1)}
                            className="rounded-radius-sm px-2 py-1 text-body-sm text-secondary hover:bg-surface-muted"
                        >
                            ›
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-caption text-tertiary">
                        {WEEKDAY_LABELS.map((label) => (
                            <span key={label}>{label}</span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {grid.map((day, index) => {
                            if (!day) return <span key={`blank-${index}`} />;
                            const isFocused = isSameDay(day, focusedDate);
                            const isEndpoint = (value.from && isSameDay(day, value.from)) || (value.to && isSameDay(day, value.to));
                            const inRange = value.from && value.to && day > value.from && day < value.to;
                            return (
                                <button
                                    key={day.toISOString()}
                                    type="button"
                                    tabIndex={isFocused ? 0 : -1}
                                    ref={(el) => {
                                        const key = day.toDateString();
                                        if (el) dayButtonRefs.current.set(key, el);
                                        else dayButtonRefs.current.delete(key);
                                    }}
                                    onClick={() => selectDay(day)}
                                    onFocus={() => setFocusedDate(day)}
                                    className={`rounded-radius-sm py-1 text-body-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${
                                        isEndpoint
                                            ? "bg-action-primary-bg text-inverse"
                                            : inRange
                                              ? "bg-nav-selected-bg text-nav-selected-text"
                                              : "text-primary hover:bg-surface-muted"
                                    }`}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangeInput;
