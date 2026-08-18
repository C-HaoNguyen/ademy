package com.example.academic_management_api.enrollment.controller;

import com.example.academic_management_api.enrollment.dto.EnrollRequest;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/enrollments")
public class EnrollmentController {
    private final EnrollmentService enrollmentService;

    public EnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping
    public ResponseEntity<?> enroll(@Valid @RequestBody EnrollRequest request, Authentication authentication) {
        return enrollmentService.enroll(request, authentication.getName());
    }

    @GetMapping("/student/me/courses")
    public ResponseEntity<?> getMyCourses(Authentication authentication) {
        return ResponseEntity.ok(enrollmentService.getMyCourses(authentication.getName()));
    }

    @GetMapping("/student/me/summary")
    public ResponseEntity<?> getStudentDashboardSummary(Authentication authentication) {
        return ResponseEntity.ok(
                Map.of("totalCourses", enrollmentService.getStudentTotalCourses(authentication.getName()))
        );
    }
}
