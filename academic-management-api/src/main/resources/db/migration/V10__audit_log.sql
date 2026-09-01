-- Phase 25: Audit logging (AOP) — (ADR-012, ADR-013, PRD-033/034)
--
-- actor_user_id nullable + on delete set null: audit log không được biến mất/vỡ FK nếu user bị
-- xóa sau này (Admin xóa user — chính là 1 trong các hành động được audit). actor_username là
-- snapshot tại thời điểm ghi log (không JOIN lại users để hiển thị) — vẫn đọc được actor kể cả
-- khi actor_user_id đã null hoá, và đúng cho cả trường hợp login thất bại (username thử đăng
-- nhập có thể không resolve được thành user thật, vd sai username).
--
-- archived_at/archive_batch_id: cột archive-ready theo ADR-013, chưa có archival job nào ghi vào
-- 2 cột này ở Phase 1 — chỉ chuẩn bị sẵn schema.
create table AUDIT_LOG (
    id serial primary key,
    actor_user_id int,
    actor_username varchar(50) not null,
    action varchar(100) not null,
    target_type varchar(50),
    target_id varchar(50),
    success boolean not null,
    metadata text,
    created_at timestamp not null default current_timestamp,
    archived_at timestamp,
    archive_batch_id varchar(50),

    foreign key (actor_user_id) references USERS(user_id)
        on delete set null
);

create index idx_audit_log_actor_user_id on AUDIT_LOG(actor_user_id);
create index idx_audit_log_action on AUDIT_LOG(action);
create index idx_audit_log_target on AUDIT_LOG(target_type, target_id);
create index idx_audit_log_created_at on AUDIT_LOG(created_at);
