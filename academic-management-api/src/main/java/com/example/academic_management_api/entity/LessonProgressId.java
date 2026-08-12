package com.example.academic_management_api.entity;

import java.util.Objects;

public class LessonProgressId {
    private Integer student;
    private Integer lesson;

    public LessonProgressId() {}

    public LessonProgressId(Integer student, Integer lesson) {
        this.student = student;
        this.lesson = lesson;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LessonProgressId)) return false;
        LessonProgressId that = (LessonProgressId) o;
        return Objects.equals(student, that.student)
                && Objects.equals(lesson, that.lesson);
    }

    @Override
    public int hashCode() {
        return Objects.hash(student, lesson);
    }
}
