create table USERS (
    username varchar(50) primary key,
    full_name varchar(100) not null,
    email varchar(100) unique not null,
    password_hash text not null,
    role varchar(20) not null
        check (role in ('admin', 'instructor', 'student')),
    created_at timestamp default current_timestamp
);

create table CATEGORIES (
    category_id serial primary key,
    category_name varchar(100) not null,
    description text
);

create table COURSES (
    course_id serial primary key,
    title varchar(200) not null,
    description text,
    instructor_username varchar(50) not null,
    category_id int,
    price numeric(10,2),
    created_at timestamp default current_timestamp,

    foreign key (instructor_username)
        references USERS(username),
    foreign key (category_id)
        references CATEGORIES(category_id)
);

create table LESSONS (
    lesson_id serial primary key,
    course_id int not null,
    title varchar(200) not null,
    content text,
    order_index int,

    foreign key (course_id)
        references COURSES(course_id)
);

create table ENROLLMENTS (
    enrollment_id serial primary key,
    student_username varchar(50) not null,
    course_id int not null,
    enrolled_at timestamp default current_timestamp,

    unique (student_username, course_id),

    foreign key (student_username)
        references USERS(username),
    foreign key (course_id)
        references COURSES(course_id)
);

create table LESSON_PROGRESS (
    student_username varchar(50),
    lesson_id int,
    completed boolean default false,
    completed_at timestamp,

    primary key (student_username, lesson_id),

    foreign key (student_username)
        references USERS(username),
    foreign key (lesson_id)
        references LESSONS(lesson_id)
);
