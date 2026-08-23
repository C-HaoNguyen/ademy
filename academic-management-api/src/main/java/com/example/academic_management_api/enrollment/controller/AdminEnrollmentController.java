package com.example.academic_management_api.enrollment.controller;

import com.example.academic_management_api.enrollment.dto.RevokeAccessRequest;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminEnrollmentController {

    private final EnrollmentService enrollmentService;

    public AdminEnrollmentController(EnrollmentService enrollmentService) {
        this.enrollmentService = enrollmentService;
    }

    @PostMapping("/enrollments/{id}/revoke-access")
    public ResponseEntity<?> revokeAccess(@PathVariable Integer id, @Valid @RequestBody RevokeAccessRequest request) {
        enrollmentService.revokeAccess(id, request.getReason());
        return ResponseEntity.ok().build();
    }
}
