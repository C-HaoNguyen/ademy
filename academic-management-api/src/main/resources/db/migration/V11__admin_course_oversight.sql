-- Phase 31: AdminCourses chuyển sang giám sát (PRD-027, PRD-030, ADR-008, ADR-025)
--
-- admin_locked: đánh dấu course bị Admin force-unpublish — chặn Teacher tự publish lại qua
-- updateOwnCourse (known issue kế thừa từ Phase 18, chốt xử lý ở Phase 31).
-- published_at: thời điểm course chuyển sang PUBLISHED gần nhất — phục vụ cột "Ngày publish"
-- (UI_SPEC §5.3), thay proxy updated_at đã ghi nhận hạn chế ở CourseRepository (Phase 29).
-- force_unpublish_reason: lý do vi phạm Admin nhập khi force-unpublish (UI_SPEC §5.3 "Modal xác
-- nhận + lý do vi phạm") — lưu trên chính course, cùng pattern access_revoked_reason ở Enrollments
-- (V4) thay vì mở rộng cơ chế audit log metadata (Phase 25) vốn chỉ dùng cho error message.
alter table COURSES
    add column admin_locked boolean not null default false,
    add column published_at timestamp,
    add column force_unpublish_reason text;
