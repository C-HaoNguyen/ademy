import { useCallback, useRef, useState, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X, type LucideIcon } from "lucide-react";
import { ToastContext, type ShowToastInput, type ToastTone } from "./toastContextObject";

const TOAST_DURATION_MS = 3000;

type ToastItem = ShowToastInput & { id: number };

const toneConfig: Record<
    ToastTone,
    { icon: LucideIcon; role: "status" | "alert"; iconClass: string; textClass: string }
> = {
    success: {
        icon: CheckCircle,
        role: "status",
        iconClass: "text-status-success-icon",
        textClass: "text-status-success-text",
    },
    info: {
        icon: Info,
        role: "status",
        iconClass: "text-status-info-icon",
        textClass: "text-status-info-text",
    },
    warning: {
        icon: AlertTriangle,
        role: "alert",
        iconClass: "text-status-warning-icon",
        textClass: "text-status-warning-text",
    },
    danger: {
        icon: XCircle,
        role: "alert",
        iconClass: "text-status-danger-icon",
        textClass: "text-status-danger-text",
    },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const dismissToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        ({ tone, message }: ShowToastInput) => {
            const id = nextId.current++;
            setToasts((prev) => [...prev, { id, tone, message }]);
            setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
        },
        [dismissToast]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-toast flex flex-col gap-2">
                {toasts.map((toast) => {
                    const { icon: Icon, role, iconClass, textClass } = toneConfig[toast.tone];
                    return (
                        <div
                            key={toast.id}
                            role={role}
                            className="flex items-center gap-2 rounded-radius-md bg-surface px-4 py-3 shadow-elevated animate-slideIn"
                        >
                            <Icon size={18} className={`shrink-0 ${iconClass}`} />
                            <p className={`text-body-sm ${textClass}`}>{toast.message}</p>
                            <button
                                type="button"
                                onClick={() => dismissToast(toast.id)}
                                aria-label="Đóng thông báo"
                                className="ml-2 shrink-0 text-tertiary hover:text-primary"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
