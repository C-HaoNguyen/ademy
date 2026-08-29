package com.example.academic_management_api.assessment.repository;

import com.example.academic_management_api.assessment.entity.Quizzes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizRepository extends JpaRepository<Quizzes, Integer> {

    Optional<Quizzes> findByCourse_CourseId(Integer courseId);

    Optional<Quizzes> findByLesson_LessonId(Integer lessonId);
}
