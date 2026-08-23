-- Phase 17: TEACHER role thật — rename INSTRUCTOR -> TEACHER (role không tồn tại
-- trong hệ role thật theo ARCHITECTURE.md §14 / PRD-004: chỉ có STUDENT/TEACHER/ADMIN).
-- One-way migration: mọi row role='INSTRUCTOR' chuyển thành 'TEACHER', không rollback tự động.
alter table USERS
    drop constraint users_role_check;

update USERS set role = 'TEACHER' where role = 'INSTRUCTOR';

alter table USERS
    add constraint users_role_check check (role in ('ADMIN', 'TEACHER', 'STUDENT'));
