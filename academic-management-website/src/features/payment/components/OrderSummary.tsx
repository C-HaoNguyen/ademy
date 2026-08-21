import { motion } from "framer-motion";
import { CheckCircle2, Tag } from "lucide-react";

type OrderSummaryProps = {
    title: string;
    instructor: string;
    price: number;
    discount: number;
    coupon: string;
    thumbnail?: string;

    enableCoupon?: boolean;
    couponError?: string | null;
    onCouponChange: (v: string) => void;
    onApplyCoupon: () => void;
};

const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "₫";

const OrderSummary = ({
    title,
    instructor,
    price,
    discount,
    coupon,
    thumbnail,
    enableCoupon,
    couponError,
    onCouponChange,
    onApplyCoupon
}: OrderSummaryProps) => {
    const total = Math.max(price - discount, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-card bg-white p-6 shadow-sm border border-slate-100 h-fit"
        >
            <h3 className="mb-4 text-lg font-semibold text-legacy-ink">
                Chi tiết thanh toán
            </h3>

            {/* Course info */}
            <div className="mb-4 flex gap-4">
                <img
                    src={thumbnail}
                    alt={title}
                    className="h-20 w-32 rounded-lg object-cover shrink-0"
                />
                <div>
                    <p className="font-semibold text-legacy-ink">{title}</p>
                    <p className="text-sm text-slate-500">
                        Giảng viên: {instructor}
                    </p>
                </div>
            </div>

            {/* Coupon */}
            {enableCoupon && (
                <div className="mb-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Tag className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
                            <input
                                value={coupon}
                                onChange={(e) => onCouponChange?.(e.target.value)}
                                placeholder="Nhập mã giảm giá"
                                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm
                                           focus:outline-none focus:ring-2 focus:ring-legacy-primary/30 focus:border-legacy-primary transition-colors duration-200"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={onApplyCoupon}
                            className="cursor-pointer rounded-xl bg-legacy-primary px-4 py-2 text-sm text-white hover:bg-legacy-primary-dark transition-colors duration-200"
                        >
                            Áp dụng
                        </button>
                    </div>
                    {couponError && <p className="mt-1 text-xs text-legacy-danger">{couponError}</p>}
                </div>
            )}

            {/* Price */}
            <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                    <span>Giá gốc</span>
                    <span>{formatPrice(price)}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between text-legacy-success">
                        <span>Giảm giá</span>
                        <span>-{formatPrice(discount)}</span>
                    </div>
                )}

                <hr className="border-slate-200" />

                <div className="flex justify-between text-lg font-semibold text-legacy-ink">
                    <span>Tổng cộng</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                <CheckCircle2 size={16} className="text-legacy-success" aria-hidden="true" />
                Hoàn tiền trong 30 ngày nếu không hài lòng
            </p>
        </motion.div>
    );
};

export default OrderSummary;
