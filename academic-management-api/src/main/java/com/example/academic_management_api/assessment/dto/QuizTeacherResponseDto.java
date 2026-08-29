package com.example.academic_management_api.assessment.dto;

import com.example.academic_management_api.assessment.entity.Quizzes;

import java.util.List;

public class QuizTeacherResponseDto {
    private final Integer id;
    private final Integer courseId;
    private final Integer lessonId;
    private final String title;
    private final List<TeacherQuestionDto> questions;

    public QuizTeacherResponseDto(Quizzes quiz, List<TeacherQuestionDto> questions) {
        this.id = quiz.getId();
        this.courseId = quiz.getCourse() != null ? quiz.getCourse().getCourseId() : null;
        this.lessonId = quiz.getLesson() != null ? quiz.getLesson().getLessonId() : null;
        this.title = quiz.getTitle();
        this.questions = questions;
    }

    public Integer getId() {
        return id;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public Integer getLessonId() {
        return lessonId;
    }

    public String getTitle() {
        return title;
    }

    public List<TeacherQuestionDto> getQuestions() {
        return questions;
    }
}
