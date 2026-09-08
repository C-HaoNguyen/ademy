package com.example.academic_management_api.enrollment.controller;

import com.example.academic_management_api.enrollment.dto.EnrolledStudentDto;
import com.example.academic_management_api.enrollment.dto.RevokeAccessRequest;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminEnrollmentController {

    private final EnrollmentService enrollmentService;

    public AdminEnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    // Phase 31 — AdminCourses "Thu hồi quyền truy cập": liệt kê học viên (kèm enrollmentId) để
    // Admin chọn đúng người trước khi gọi revoke-access bên dưới.
    @GetMapping("/courses/{id}/students")
    public ResponseEntity<List<EnrolledStudentDto>> getStudentsByCourse(@PathVariable Integer id) {
        return ResponseEntity.ok(enrollmentService.getStudentsByCourseAsAdmin(id));
    }

    @PostMapping("/enrollments/{id}/revoke-access")
    public ResponseEntity<?> revokeAccess(@PathVariable Integer id, @Valid @RequestBody RevokeAccessRequest request) {
        enrollmentService.revokeAccess(id, request.getReason());
        return ResponseEntity.ok().build();
    }
}
