-- Phase 22: Coupon domain (PRD-023/024, BR-003) — Admin tạo/quản lý coupon; PaymentService là nơi
-- DUY NHẤT tính amount cuối cùng khi checkout (ARCHITECTURE.md §7), coupon chỉ cung cấp dữ liệu để
-- validate/tính discount, không tự ghi payment.

create table COUPONS (
    id serial primary key,
    code varchar(50) not null,
    discount_type varchar(20) not null
        check (discount_type in ('percentage', 'fixed')),
    discount_value numeric(10, 2) not null,
    course_id int,
    max_redemptions int,
    redemption_count int not null default 0,
    expires_at timestamp,
    active boolean not null default true,
    created_at timestamp default current_timestamp,

    constraint coupons_code_uq unique (code),
    foreign key (course_id)
        references COURSES(course_id)
);

create index idx_coupons_course_id on COUPONS(course_id);

-- Audit trail mỗi lần coupon được dùng thành công tại 1 payment cụ thể — dùng để phục vụ cột
-- "Số lượt đã dùng" ở AdminCoupons (Phase 36) và để đối chiếu khi cần điều tra.
create table COUPON_REDEMPTIONS (
    id serial primary key,
    coupon_id int not null,
    payment_id int not null,
    discount_amount numeric(10, 2) not null,
    redeemed_at timestamp default current_timestamp,

    foreign key (coupon_id)
        references COUPONS(id),
    foreign key (payment_id)
        references PAYMENTS(payment_id)
);

create index idx_coupon_redemptions_coupon_id on COUPON_REDEMPTIONS(coupon_id);
create index idx_coupon_redemptions_payment_id on COUPON_REDEMPTIONS(payment_id);

alter table PAYMENTS
    add column coupon_id int,
    add constraint payments_coupon_id_fk foreign key (coupon_id) references COUPONS(id);

create index idx_payments_coupon_id on PAYMENTS(coupon_id);
