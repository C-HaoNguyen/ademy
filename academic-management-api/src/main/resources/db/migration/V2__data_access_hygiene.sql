-- Phase 5: Data access hygiene
-- 1. LessonProgress: composite key (student_id, lesson_id) -> surrogate key + unique constraint
alter table LESSON_PROGRESS
    drop constraint lesson_progress_pkey;

alter table LESSON_PROGRESS
    add column progress_id serial;

alter table LESSON_PROGRESS
    add primary key (progress_id);

alter table LESSON_PROGRESS
    add constraint uq_lesson_progress_student_lesson unique (student_id, lesson_id);

-- 2. Index every FK column
create index idx_courses_instructor_id on COURSES(instructor_id);
create index idx_courses_category_id on COURSES(category_id);

create index idx_lessons_course_id on LESSONS(course_id);

create index idx_enrollments_student_id on ENROLLMENTS(student_id);
create index idx_enrollments_course_id on ENROLLMENTS(course_id);

create index idx_lesson_progress_student_id on LESSON_PROGRESS(student_id);
create index idx_lesson_progress_lesson_id on LESSON_PROGRESS(lesson_id);

create index idx_payments_student_id on PAYMENTS(student_id);
create index idx_payments_course_id on PAYMENTS(course_id);
