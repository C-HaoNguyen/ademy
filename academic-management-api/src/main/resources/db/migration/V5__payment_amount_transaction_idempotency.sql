-- Phase 19: Payment amount server-side + transactional checkout + idempotency (ADR-006, ADR-007)

-- 1. Cho phép student mua lại course sau khi bị Admin thu hồi quyền truy cập (Phase 18):
--    unique constraint cũ chặn cả trường hợp enrollment cũ đã bị revoke. Đổi sang partial
--    unique index: chỉ enrollment còn active (chưa bị revoke) mới cần là duy nhất theo
--    (student_id, course_id); enrollment đã revoke giữ lại làm lịch sử/audit trail.
alter table ENROLLMENTS
    drop constraint enrollments_student_id_course_id_key;

create unique index enrollments_active_student_course_uq
    on ENROLLMENTS (student_id, course_id)
    where access_revoked_at is null;

-- 2. Dedup checkout theo header Idempotency-Key (EC-001, EC-002).
create table PAYMENT_IDEMPOTENCY_KEYS (
    idempotency_key varchar(100) primary key,

    student_id int not null,
    payment_id int not null,

    created_at timestamp default current_timestamp,

    foreign key (student_id)
        references USERS(user_id),
    foreign key (payment_id)
        references PAYMENTS(payment_id)
);

create index idx_payment_idempotency_keys_payment_id on PAYMENT_IDEMPOTENCY_KEYS(payment_id);
