import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

type PaymentSuccessOverlayProps = {
    open: boolean;
    onClose: () => void;
};

const PaymentSuccessOverlay = ({
    open,
}: PaymentSuccessOverlayProps) => {

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="rounded-2xl bg-white p-8 text-center shadow-xl max-w-md w-full"
                    >
                        <div className="mb-4 text-5xl">🎉</div>

                        <h2 className="mb-2 text-2xl font-bold text-gray-800">
                            Thanh toán thành công!
                        </h2>

                        <p className="mb-6 text-gray-600">
                            Bạn đã đăng ký khóa học thành công.
                        </p>

                        <Link to="/student/my-courses">
                            <button
                                className="rounded-xl bg-indigo-600 px-6 py-3
                                       font-semibold text-white hover:bg-indigo-700 transition"
                            >
                                Về khóa học của tôi
                            </button>
                        </Link>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaymentSuccessOverlay;
