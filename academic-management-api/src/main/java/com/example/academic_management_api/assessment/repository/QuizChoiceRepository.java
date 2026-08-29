package com.example.academic_management_api.assessment.repository;

import com.example.academic_management_api.assessment.entity.QuizChoices;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizChoiceRepository extends JpaRepository<QuizChoices, Integer> {

    List<QuizChoices> findByQuestion_IdOrderByOrderIndexAsc(Integer questionId);

    List<QuizChoices> findByQuestion_IdInOrderByOrderIndexAsc(List<Integer> questionIds);

    List<QuizChoices> findByQuestion_IdInAndIsCorrectTrue(List<Integer> questionIds);
}
