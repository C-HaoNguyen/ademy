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
    // Chặn đóng modal (Escape, click overlay, nút X) khi đang có thao tác submit dở dang — trước đây
    // mỗi consumer (UserFormOverlay/CategoryFormOverlay/LockUserModal) tự bọc onClose bằng 1 guard
    // `if (submitting) return` giống hệt nhau; gộp về đây để không lặp lại và không bị quên ở modal mới.
    closeDisabled?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
    sm: "max-w-[400px]",
    md: "max-w-[560px]",
    lg: "max-w-[720px]",
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const Modal = ({ open, onClose, title, children, footer, size = "md", closeDisabled = false }: ModalProps) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    const closeDisabledRef = useRef(closeDisabled);
    closeDisabledRef.current = closeDisabled;

    const handleClose = () => {
        if (closeDisabledRef.current) return;
        onClose();
    };

    const onCloseRef = useRef(handleClose);
    onCloseRef.current = handleClose;

    const mouseDownOnOverlayRef = useRef(false);

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current = document.activeElement as HTMLElement | null;

        const panel = panelRef.current;
        const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        (focusables?.[0] ?? panel)?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCloseRef.current();
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
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-modal flex items-center justify-center bg-surface-inverse/40 animate-overlayFade"
            onMouseDown={(e) => {
                mouseDownOnOverlayRef.current = e.target === e.currentTarget;
            }}
            onClick={(e) => {
                if (mouseDownOnOverlayRef.current && e.target === e.currentTarget) {
                    handleClose();
                }
            }}
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
                        onClick={handleClose}
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
