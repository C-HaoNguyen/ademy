package com.example.academic_management_api.course.lesson.controller;

import com.example.academic_management_api.course.lesson.dto.StudentCourseLessonsDto;
import com.example.academic_management_api.course.lesson.dto.StudentLessonDto;
import com.example.academic_management_api.course.lesson.service.LessonService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Route rơi vào anyRequest().authenticated() mặc định (cùng tiền lệ StudentQuizController ở
// /quizzes) — KHÔNG đặt dưới /courses/** vì nhánh đó đang permitAll trong SecurityConfig; enrollment/
// preview check enforce trong LessonService (BR-007, ADR-025).
@RestController
@RequestMapping("/lessons")
public class StudentLessonController {

    private final LessonService lessonService;

    public StudentLessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<StudentCourseLessonsDto> getCourseLessons(@PathVariable Integer courseId, Authentication authentication) {
        return ResponseEntity.ok(lessonService.getLessonsForStudent(courseId, authentication.getName()));
    }

    @PostMapping("/{lessonId}/complete")
    public ResponseEntity<StudentLessonDto> markComplete(@PathVariable Integer lessonId, Authentication authentication) {
        return ResponseEntity.ok(lessonService.markLessonComplete(lessonId, authentication.getName()));
    }
}
