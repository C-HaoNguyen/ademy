package com.example.academic_management_api.assessment.repository;

import com.example.academic_management_api.assessment.entity.QuizAttempts;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempts, Integer> {

    List<QuizAttempts> findByQuiz_IdAndStudent_UserIdOrderBySubmittedAtDesc(Integer quizId, Integer studentId);
}
