package com.example.academic_management_api.assessment.repository;

import com.example.academic_management_api.assessment.entity.QuizQuestions;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestions, Integer> {

    List<QuizQuestions> findByQuiz_IdOrderByOrderIndexAsc(Integer quizId);

    void deleteByQuiz_Id(Integer quizId);
}
