-- Phase 21: Payment Gateway port/adapter (ADR-009) — cột đối chiếu callback/webhook thật với
-- payment record. Dùng chính Idempotency-Key của request checkout làm transaction reference gửi
-- cho gateway (vnp_TxnRef/orderId/client_reference_id), nên không cần sinh thêm mã giao dịch riêng.
alter table PAYMENTS
    add column gateway_transaction_ref varchar(100);

create unique index payments_gateway_transaction_ref_uq
    on PAYMENTS (gateway_transaction_ref)
    where gateway_transaction_ref is not null;
