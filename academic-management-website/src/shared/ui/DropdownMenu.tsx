import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";

export interface DropdownMenuItem {
    label: string;
    onClick: () => void;
    destructive?: boolean;
}

interface DropdownMenuProps {
    trigger: ReactElement<{
        onClick?: () => void;
        "aria-haspopup"?: string;
        "aria-expanded"?: boolean;
    }>;
    items: DropdownMenuItem[];
}

const DropdownMenu = ({ trigger, items }: DropdownMenuProps) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                return;
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const currentIndex = itemRefs.current.findIndex((el) => el === document.activeElement);
                const delta = e.key === "ArrowDown" ? 1 : -1;
                const nextIndex = (currentIndex + delta + items.length) % items.length;
                itemRefs.current[nextIndex]?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, items.length]);

    useEffect(() => {
        if (open) {
            itemRefs.current[0]?.focus();
        }
    }, [open]);

    const triggerElement = cloneElement(trigger, {
        onClick: () => setOpen((prev) => !prev),
        "aria-haspopup": "menu",
        "aria-expanded": open,
    });

    return (
        <div ref={containerRef} className="relative inline-block">
            {triggerElement}
            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-dropdown mt-1 min-w-[160px] rounded-radius-md bg-surface py-1 shadow-elevated"
                >
                    {items.map((item, index) => (
                        <button
                            key={item.label}
                            ref={(el) => {
                                itemRefs.current[index] = el;
                            }}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                item.onClick();
                                setOpen(false);
                            }}
                            className={`block w-full px-3 py-2 text-left text-body-sm hover:bg-surface-muted ${
                                item.destructive ? "text-status-danger-text" : "text-primary"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
