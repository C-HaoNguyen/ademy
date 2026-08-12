interface ToastProps {
    message: string;
    type: "success" | "error";
}

const Toast = ({ message, type }: ToastProps) => {
    return (
        <div
            className={`
                fixed bottom-6 right-6 z-50
                px-6 py-3 rounded-xl shadow-lg
                text-white font-medium
                animate-slideIn
                ${type === "success" ? "bg-green-600" : "bg-red-600"}
            `}
        >
            {message}
        </div>
    );
};

export default Toast;
