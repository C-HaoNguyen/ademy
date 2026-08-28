-- Phase 23: Refund domain (ADR-010, ADR-011, PRD-025/026, BR-009) — tách business state
-- (REQUESTED/APPROVED/REJECTED, do Admin quyết định) khỏi execution state (NOT_STARTED/
-- MANUAL_COMPLETED, việc hoàn tiền thực tế đã xảy ra chưa). Phase 1 chỉ có ManualRefundGateway —
-- không gọi API refund thật của gateway nào.

create table REFUND_REQUESTS (
    id serial primary key,
    payment_id int not null,
    student_id int not null,
    reason text not null,
    business_status varchar(20) not null default 'requested'
        check (business_status in ('requested', 'approved', 'rejected')),
    admin_note text,
    execution_status varchar(20) not null default 'not_started'
        check (execution_status in ('not_started', 'manual_completed')),
    gateway_refund_reference varchar(100),
    requested_at timestamp default current_timestamp,
    decided_at timestamp,
    completed_at timestamp,

    foreign key (payment_id)
        references PAYMENTS(payment_id),
    foreign key (student_id)
        references USERS(user_id)
);

create index idx_refund_requests_payment_id on REFUND_REQUESTS(payment_id);
create index idx_refund_requests_student_id on REFUND_REQUESTS(student_id);

-- Chặn 2 request đồng thời cùng payment cùng "sống" (REQUESTED hoặc APPROVED) ở DB level — cùng
-- nguyên tắc enrollments_active_student_course_uq (V5): request đã REJECTED không tính, cho phép
-- gửi lại. RefundService.existsByPaymentAndBusinessStatusNot() chỉ là fast-path kiểm tra sớm,
-- không đủ để đóng race 2 request đồng thời (2 transaction đều đọc "chưa có request nào" trước khi
-- transaction nào commit) — partial unique index này mới là ràng buộc thật.
create unique index refund_requests_active_payment_uq
    on REFUND_REQUESTS (payment_id)
    where business_status <> 'rejected';

-- Dedup riêng cho POST /refund-requests theo Idempotency-Key (ADR-007) — bảng riêng, KHÔNG tái
-- dùng PAYMENT_IDEMPOTENCY_KEYS: payment_id ở bảng đó là NOT NULL, khóa cứng cho dedup checkout
-- (Phase 19); refund-request dedup theo refund_request_id, đổi schema của bảng đang phục vụ
-- production logic checkout thật là rủi ro không cần thiết. Cùng cơ chế theo ADR-007 (client sinh
-- UUID, server lưu bảng dedup riêng, replay kết quả request đầu tiên), khác bảng vật lý.
create table REFUND_IDEMPOTENCY_KEYS (
    idempotency_key varchar(100) primary key,
    student_id int not null,
    refund_request_id int not null,
    created_at timestamp default current_timestamp,

    foreign key (student_id)
        references USERS(user_id),
    foreign key (refund_request_id)
        references REFUND_REQUESTS(id)
);

create index idx_refund_idempotency_keys_refund_request_id on REFUND_IDEMPOTENCY_KEYS(refund_request_id);
