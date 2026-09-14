package com.example.academic_management_api.assessment.controller;

import com.example.academic_management_api.assessment.dto.CourseTestSummaryDto;
import com.example.academic_management_api.assessment.dto.QuizStudentResponseDto;
import com.example.academic_management_api.assessment.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Route rơi vào anyRequest().authenticated() mặc định (cùng tiền lệ /payments/checkout,
// /refund-requests) — không thêm matcher SecurityConfig, ownership/enrollment enforce trong service.
@RestController
@RequestMapping("/quizzes")
public class StudentQuizController {

    private final QuizService quizService;

    public StudentQuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<QuizStudentResponseDto> getCourseQuiz(@PathVariable Integer courseId, Authentication authentication) {
        return ResponseEntity.ok(quizService.getCourseQuizForStudent(courseId, authentication.getName()));
    }

    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<QuizStudentResponseDto> getLessonQuiz(@PathVariable Integer lessonId, Authentication authentication) {
        return ResponseEntity.ok(quizService.getLessonQuizForStudent(lessonId, authentication.getName()));
    }

    // Phase 34 — Test Practice hub.
    @GetMapping("/me/course-tests")
    public ResponseEntity<List<CourseTestSummaryDto>> getMyCourseTests(Authentication authentication) {
        return ResponseEntity.ok(quizService.getMyCourseTests(authentication.getName()));
    }
}
