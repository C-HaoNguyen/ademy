package com.example.academic_management_api.enrollment.controller;

import com.example.academic_management_api.enrollment.dto.EnrolledStudentDto;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/teacher/courses")
public class TeacherEnrollmentController {

    private final EnrollmentService enrollmentService;

    public TeacherEnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<EnrolledStudentDto>> getStudents(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(enrollmentService.getStudentsByCourse(id, authentication.getName()));
    }
}
