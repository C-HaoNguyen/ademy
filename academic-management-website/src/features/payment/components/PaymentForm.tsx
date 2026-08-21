import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2 } from "lucide-react";

type PaymentFormProps = {
    onSubmit: () => void | Promise<void>;
};

type FormErrors = Partial<Record<"cardNumber" | "expiry" | "cvc" | "name", string>>;

const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
};

const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const PaymentForm = ({ onSubmit }: PaymentFormProps) => {
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [name, setName] = useState("");
    const [saveCard, setSaveCard] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const validate = (): boolean => {
        const nextErrors: FormErrors = {};
        const digits = cardNumber.replace(/\D/g, "");

        if (digits.length !== 16) {
            nextErrors.cardNumber = "Số thẻ phải gồm 16 chữ số";
        }

        const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(expiry);
        if (!expiryMatch) {
            nextErrors.expiry = "Định dạng MM/YY";
        } else {
            const month = Number(expiryMatch[1]);
            if (month < 1 || month > 12) {
                nextErrors.expiry = "Tháng không hợp lệ";
            }
        }

        if (!/^\d{3,4}$/.test(cvc)) {
            nextErrors.cvc = "CVC phải gồm 3-4 chữ số";
        }

        if (!name.trim()) {
            nextErrors.name = "Vui lòng nhập tên chủ thẻ";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate() || submitting) return;

        setSubmitting(true);
        try {
            await onSubmit();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-card bg-white p-6 shadow-sm border border-slate-100"
            noValidate
        >
            <h2 className="mb-6 text-xl font-semibold text-legacy-ink flex items-center gap-2">
                <CreditCard size={20} className="text-legacy-primary" aria-hidden="true" />
                Thông tin thanh toán
            </h2>

            <div className="space-y-4">
                {/* Card number */}
                <div>
                    <label htmlFor="cardNumber" className="mb-1 block text-sm font-medium text-slate-600">
                        Số thẻ
                    </label>
                    <input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        inputMode="numeric"
                        className={`w-full rounded-xl border px-4 py-3
                                   focus:outline-none focus:ring-2 transition-colors duration-200
                                   ${errors.cardNumber ? "border-legacy-danger focus:ring-legacy-danger/30" : "border-slate-300 focus:ring-legacy-primary/30 focus:border-legacy-primary"}`}
                    />
                    {errors.cardNumber && <p className="mt-1 text-xs text-legacy-danger">{errors.cardNumber}</p>}
                </div>

                {/* Expiry + CVC */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="expiry" className="mb-1 block text-sm font-medium text-slate-600">
                            Ngày hết hạn
                        </label>
                        <input
                            id="expiry"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                            inputMode="numeric"
                            className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 transition-colors duration-200
                                   ${errors.expiry ? "border-legacy-danger focus:ring-legacy-danger/30" : "border-slate-300 focus:ring-legacy-primary/30 focus:border-legacy-primary"}`}
                        />
                        {errors.expiry && <p className="mt-1 text-xs text-legacy-danger">{errors.expiry}</p>}
                    </div>

                    <div>
                        <label htmlFor="cvc" className="mb-1 block text-sm font-medium text-slate-600">
                            CVC
                        </label>
                        <input
                            id="cvc"
                            placeholder="CVC"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            inputMode="numeric"
                            className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 transition-colors duration-200
                                   ${errors.cvc ? "border-legacy-danger focus:ring-legacy-danger/30" : "border-slate-300 focus:ring-legacy-primary/30 focus:border-legacy-primary"}`}
                        />
                        {errors.cvc && <p className="mt-1 text-xs text-legacy-danger">{errors.cvc}</p>}
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label htmlFor="cardName" className="mb-1 block text-sm font-medium text-slate-600">
                        Tên chủ thẻ
                    </label>
                    <input
                        id="cardName"
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 transition-colors duration-200
                                   ${errors.name ? "border-legacy-danger focus:ring-legacy-danger/30" : "border-slate-300 focus:ring-legacy-primary/30 focus:border-legacy-primary"}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-legacy-danger">{errors.name}</p>}
                </div>

                {/* Save card */}
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(e) => setSaveCard(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-legacy-primary focus:ring-legacy-primary/30"
                    />
                    Lưu thẻ cho lần thanh toán sau
                </label>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting}
                    className="cursor-pointer mt-4 w-full rounded-xl bg-legacy-cta py-3
                               font-semibold text-white hover:bg-legacy-cta-dark transition-colors duration-200
                               disabled:opacity-60 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2"
                >
                    {submitting && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                    {submitting ? "Đang xử lý..." : "Thanh toán"}
                </button>
            </div>
        </motion.form>
    );
};

export default PaymentForm;
