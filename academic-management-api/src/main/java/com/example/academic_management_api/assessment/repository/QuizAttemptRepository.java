package com.example.academic_management_api.assessment.repository;

import com.example.academic_management_api.assessment.entity.QuizAttempts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempts, Integer> {

    List<QuizAttempts> findByQuiz_IdAndStudent_UserIdOrderBySubmittedAtDesc(Integer quizId, Integer studentId);

    long countByStudent_UserId(Integer studentId);

    // Phase 28 — điểm trung bình mọi lần làm bài của Student (Dashboard/LearningProfile). AVG trả
    // null nếu Student chưa làm bài nào (JPQL không hỗ trợ derived AVG nên phải dùng @Query).
    // Trả về Double (không phải BigDecimal dù QuizAttempts.score là BigDecimal) — theo JPA spec
    // §4.8.5, AVG() trong JPQL luôn trả Double bất kể kiểu cột gốc; khai BigDecimal ở đây sẽ ném
    // ClassCastException lúc runtime (Hibernate trả Double, Spring Data ép kiểu trực tiếp). Convert
    // sang BigDecimal ở QuizService, không phải ở đây.
    @Query("SELECT AVG(a.score) FROM QuizAttempts a WHERE a.student.userId = :studentId")
    Double averageScoreByStudentId(@Param("studentId") Integer studentId);
}
