package com.example.academic_management_api.infrastructure.refund;

import com.example.academic_management_api.application.port.RefundGatewayPort;
import org.springframework.stereotype.Component;

import java.util.UUID;

// Phase 1 (ADR-011) — adapter DUY NHẤT của RefundGatewayPort: Admin tự hoàn tiền ngoài hệ thống,
// adapter này chỉ ghi nhận trạng thái đã xử lý thủ công, KHÔNG gọi bất kỳ gateway API refund thật
// nào (VNPay/Momo/Stripe refund API triển khai ở Phase 2, thay adapter này mà không đổi
// RefundGatewayPort/domain).
@Component
public class ManualRefundGateway implements RefundGatewayPort {

    @Override
    public String gatewayId() {
        return "manual";
    }

    @Override
    public RefundOutcome executeRefund(RefundContext context) {
        return new RefundOutcome(true, "MANUAL-" + UUID.randomUUID());
    }
}
