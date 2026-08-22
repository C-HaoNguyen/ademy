import { createContext } from "react";

export type ToastTone = "success" | "warning" | "danger" | "info";

export type ShowToastInput = {
    tone: ToastTone;
    message: string;
};

export type ToastContextValue = {
    showToast: (input: ShowToastInput) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
