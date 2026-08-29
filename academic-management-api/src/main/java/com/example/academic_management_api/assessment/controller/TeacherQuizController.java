package com.example.academic_management_api.assessment.controller;

import com.example.academic_management_api.assessment.dto.QuizRequest;
import com.example.academic_management_api.assessment.dto.QuizTeacherResponseDto;
import com.example.academic_management_api.assessment.service.QuizService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/teacher/courses/{courseId}")
public class TeacherQuizController {

    private final QuizService quizService;

    public TeacherQuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping("/quiz")
    public ResponseEntity<QuizTeacherResponseDto> getCourseQuiz(@PathVariable Integer courseId, Authentication authentication) {
        return ResponseEntity.ok(quizService.getOwnCourseQuiz(courseId, authentication.getName()));
    }

    @PutMapping("/quiz")
    public ResponseEntity<QuizTeacherResponseDto> saveCourseQuiz(
            @PathVariable Integer courseId,
            @Valid @RequestBody QuizRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.saveOwnCourseQuiz(courseId, request, authentication.getName()));
    }

    @DeleteMapping("/quiz")
    public void deleteCourseQuiz(@PathVariable Integer courseId, Authentication authentication) {
        quizService.deleteOwnCourseQuiz(courseId, authentication.getName());
    }

    @GetMapping("/lessons/{lessonId}/quiz")
    public ResponseEntity<QuizTeacherResponseDto> getLessonQuiz(
            @PathVariable Integer courseId,
            @PathVariable Integer lessonId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.getOwnLessonQuiz(courseId, lessonId, authentication.getName()));
    }

    @PutMapping("/lessons/{lessonId}/quiz")
    public ResponseEntity<QuizTeacherResponseDto> saveLessonQuiz(
            @PathVariable Integer courseId,
            @PathVariable Integer lessonId,
            @Valid @RequestBody QuizRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(quizService.saveOwnLessonQuiz(courseId, lessonId, request, authentication.getName()));
    }

    @DeleteMapping("/lessons/{lessonId}/quiz")
    public void deleteLessonQuiz(
            @PathVariable Integer courseId,
            @PathVariable Integer lessonId,
            Authentication authentication
    ) {
        quizService.deleteOwnLessonQuiz(courseId, lessonId, authentication.getName());
    }
}
