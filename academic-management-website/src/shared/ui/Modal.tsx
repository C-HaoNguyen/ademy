import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
    sm: "max-w-[400px]",
    md: "max-w-[560px]",
    lg: "max-w-[720px]",
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({ open, onClose, title, children, footer, size = "md" }: ModalProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current = document.activeElement as HTMLElement | null;

        const panel = panelRef.current;
        const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        (focusables?.[0] ?? panel)?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            if (e.key !== "Tab") return;

            const currentPanel = panelRef.current;
            if (!currentPanel) return;
            const items = Array.from(currentPanel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (items.length === 0) {
                e.preventDefault();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            previousFocusRef.current?.focus();
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-modal flex items-center justify-center bg-surface-inverse/40 animate-overlayFade"
            onClick={onClose}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`w-full ${sizeClasses[size]} rounded-radius-lg bg-surface p-6 shadow-modal animate-modalPop`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between">
                    <h2 id={titleId} className="text-h3 text-primary">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng"
                        className="text-tertiary hover:text-primary"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div>{children}</div>
                {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
