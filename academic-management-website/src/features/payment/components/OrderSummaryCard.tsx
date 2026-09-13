import Card from "@/shared/ui/Card";
import Input from "@/shared/ui/Input";
import Button from "@/shared/ui/Button";
import Badge from "@/shared/ui/Badge";
import { Tag } from "lucide-react";

type OrderSummaryCardProps = {
    title: string;
    instructor: string;
    price: number;
    discount: number;
    thumbnail?: string;

    // Bước 2 (UI_SPEC §2.9) chỉ cần tóm tắt rút gọn 1 dòng, không có ô coupon.
    compact?: boolean;

    // Coupon (chỉ dùng khi compact=false, Bước 1 — UI_SPEC §2.8)
    couponCode?: string;
    couponError?: string | null;
    couponApplied?: boolean;
    couponLoading?: boolean;
    onCouponChange?: (v: string) => void;
    onApplyCoupon?: () => void;
};

const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "₫";

const OrderSummaryCard = ({
    title,
    instructor,
    price,
    discount,
    thumbnail,
    compact = false,
    couponCode,
    couponError,
    couponApplied,
    couponLoading,
    onCouponChange,
    onApplyCoupon,
}: OrderSummaryCardProps) => {
    const total = Math.max(price - discount, 0);

    if (compact) {
        return (
            <Card variant="marketing" className="flex items-center justify-between gap-4">
                <p className="font-medium text-primary truncate">{title}</p>
                <p className="text-body-lg font-semibold text-primary shrink-0" aria-live="polite">
                    {formatPrice(total)}
                </p>
            </Card>
        );
    }

    return (
        <Card variant="marketing" className="h-fit">
            <h3 className="mb-4 text-lg font-semibold text-primary">Chi tiết thanh toán</h3>

            <div className="mb-4 flex gap-4">
                <img
                    src={thumbnail}
                    alt={title}
                    className="h-20 w-32 rounded-radius-md object-cover shrink-0"
                />
                <div>
                    <p className="font-semibold text-primary">{title}</p>
                    <p className="text-body-sm text-tertiary">Giảng viên: {instructor}</p>
                </div>
            </div>

            {onCouponChange && (
                <div className="mb-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Tag
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
                                size={16}
                                aria-hidden="true"
                            />
                            <Input
                                value={couponCode ?? ""}
                                onChange={(e) => onCouponChange(e.target.value)}
                                placeholder="Nhập mã giảm giá"
                                hasError={Boolean(couponError)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="button" variant="secondary" loading={couponLoading} onClick={onApplyCoupon}>
                            Áp dụng
                        </Button>
                    </div>
                    {couponError && <p className="mt-1 text-caption text-status-danger-text">{couponError}</p>}
                    {couponApplied && !couponError && (
                        <Badge variant="status" tone="success">
                            Đã áp dụng
                        </Badge>
                    )}
                </div>
            )}

            <div className="space-y-2 text-body-sm">
                <div className="flex justify-between text-secondary">
                    <span>Giá gốc</span>
                    <span>{formatPrice(price)}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between text-status-success-text">
                        <span>Giảm giá</span>
                        <span>-{formatPrice(discount)}</span>
                    </div>
                )}

                <hr className="border-default" />

                <div className="flex justify-between text-lg font-semibold text-primary" aria-live="polite">
                    <span>Tổng cộng</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>
        </Card>
    );
};

export default OrderSummaryCard;
