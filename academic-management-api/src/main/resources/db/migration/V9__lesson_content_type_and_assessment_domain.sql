-- Phase 24: Lessons CRUD (content_type/video_url) + Assessment/Quiz domain
-- (PRD-012, PRD-013, PRD-014, PRD-018/019, BR-006/007, ADR-008, ADR-015)
--
-- Lessons chưa từng có CRUD API (chỉ có entity từ Phase 5) — thêm content_type để phân biệt
-- video/tài liệu/quiz theo PRD-012, video_url để lưu publicUrl trả về từ presign flow (Phase 20).
alter table LESSONS
    add column content_type varchar(20) not null default 'document'
        check (content_type in ('video', 'document', 'quiz')),
    add column video_url varchar(500);

alter table LESSONS alter column content_type drop default;

-- 1 quiz "test tổng" tối đa 1 cái mỗi course (UI_SPEC §4.3), hoặc 1 quiz gắn vào 1 lesson cụ thể
-- (PRD-013) — đúng 1 trong 2 target, không cả 2 cũng không cả rỗng.
create table QUIZZES (
    id serial primary key,
    course_id int,
    lesson_id int,
    title varchar(200) not null,
    created_at timestamp default current_timestamp,

    constraint quizzes_target_check check (
        (course_id is not null and lesson_id is null)
        or (course_id is null and lesson_id is not null)
    ),
    constraint quizzes_course_id_uq unique (course_id),
    constraint quizzes_lesson_id_uq unique (lesson_id),

    foreign key (course_id) references COURSES(course_id),
    foreign key (lesson_id) references LESSONS(lesson_id)
);

create index idx_quizzes_course_id on QUIZZES(course_id);
create index idx_quizzes_lesson_id on QUIZZES(lesson_id);

create table QUIZ_QUESTIONS (
    id serial primary key,
    quiz_id int not null,
    question_text text not null,
    order_index int not null,

    foreign key (quiz_id) references QUIZZES(id)
        on delete cascade
);

create index idx_quiz_questions_quiz_id on QUIZ_QUESTIONS(quiz_id);

create table QUIZ_CHOICES (
    id serial primary key,
    question_id int not null,
    choice_text text not null,
    is_correct boolean not null default false,
    order_index int not null,

    foreign key (question_id) references QUIZ_QUESTIONS(id)
        on delete cascade
);

create index idx_quiz_choices_question_id on QUIZ_CHOICES(question_id);

-- Chỉ lưu điểm tổng hợp mỗi lần làm bài (score/correct_count/total_questions) — UI_SPEC §3.5 chỉ
-- yêu cầu hiển thị điểm số + số câu đúng/sai, không yêu cầu xem lại đáp án đúng chi tiết từng câu,
-- nên không cần bảng lưu đáp án đã chọn theo từng câu (giữ đúng 4 bảng đã định trong REFACTOR_PLAN).
create table QUIZ_ATTEMPTS (
    id serial primary key,
    quiz_id int not null,
    student_id int not null,
    score numeric(5, 2) not null,
    correct_count int not null,
    total_questions int not null,
    submitted_at timestamp default current_timestamp,

    foreign key (quiz_id) references QUIZZES(id),
    foreign key (student_id) references USERS(user_id)
);

create index idx_quiz_attempts_quiz_id on QUIZ_ATTEMPTS(quiz_id);
create index idx_quiz_attempts_student_id on QUIZ_ATTEMPTS(student_id);
