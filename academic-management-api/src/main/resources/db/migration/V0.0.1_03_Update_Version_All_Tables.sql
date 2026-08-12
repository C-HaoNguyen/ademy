create table USERS (
    user_id serial primary key,

    username varchar(50) unique not null,
    full_name varchar(100) not null,
    email varchar(100) unique not null,
    password_hash text not null,

    role varchar(20) not null
        check (role in ('admin', 'instructor', 'student')),

    is_active boolean default true,

    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp
);

create table CATEGORIES (
    category_id serial primary key,
    category_name varchar(100) not null,
    description text,
    created_at timestamp default current_timestamp
);

create table COURSES (
    course_id serial primary key,

    title varchar(200) not null,
    description text,

    instructor_id int not null,
    category_id int,

    price numeric(10,2) default 0,
    thumbnail varchar(500),

    level varchar(20)
        check (level in ('beginner', 'intermediate', 'advanced')),

    status varchar(20)
        check (status in ('draft', 'published', 'archived'))
        default 'draft',

    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp,

    foreign key (instructor_id)
        references USERS(user_id),

    foreign key (category_id)
        references CATEGORIES(category_id)
);

create table LESSONS (
    lesson_id serial primary key,

    course_id int not null,
    title varchar(200) not null,
    content text,

    order_index int not null,
    duration int, -- phút

    is_preview boolean default false,

    created_at timestamp default current_timestamp,

    foreign key (course_id)
        references COURSES(course_id)
        on delete cascade
);

create table ENROLLMENTS (
    enrollment_id serial primary key,

    student_id int not null,
    course_id int not null,

    enrolled_at timestamp default current_timestamp,

    unique (student_id, course_id),

    foreign key (student_id)
        references USERS(user_id),

    foreign key (course_id)
        references COURSES(course_id)
);

create table LESSON_PROGRESS (
    student_id int not null,
    lesson_id int not null,

    completed boolean default false,
    completed_at timestamp,

    primary key (student_id, lesson_id),

    foreign key (student_id)
        references USERS(user_id),

    foreign key (lesson_id)
        references LESSONS(lesson_id)
        on delete cascade
);

create table PAYMENTS (
    payment_id serial primary key,

    student_id int not null,
    course_id int not null,

    amount numeric(10,2),
    payment_method varchar(50),
    status varchar(20)
        check (status in ('pending', 'success', 'failed')),

    created_at timestamp default current_timestamp,

    foreign key (student_id)
        references USERS(user_id),
    foreign key (course_id)
        references COURSES(course_id)
);

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('ADMIN', 'INSTRUCTOR', 'STUDENT'));