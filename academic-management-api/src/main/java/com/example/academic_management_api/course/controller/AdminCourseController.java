package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.course.dto.AdminCourseListDto;
import com.example.academic_management_api.course.dto.ForceUnpublishRequest;
import com.example.academic_management_api.course.dto.RecentlyPublishedCourseDto;
import com.example.academic_management_api.course.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminCourseController {

    private final CourseService courseService;

    public AdminCourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/courses")
    public List<AdminCourseListDto> getAllCourses() {
        return courseService.getAllCourses();
    }

    @GetMapping("/total-courses")
    public ResponseEntity<?> getTotalCourses(Authentication authentication) {
        long totalCourses = courseService.getTotalCourses();

        return ResponseEntity.ok(
                Map.of("totalCourses", totalCourses)
        );
    }

    // Phase 29 — AdminDashboard danh sách rút gọn (top 5 course PUBLISHED mới cập nhật gần nhất).
    @GetMapping("/courses/recently-published")
    public List<RecentlyPublishedCourseDto> getRecentlyPublishedCourses() {
        return courseService.getRecentlyPublished(5);
    }

    @PostMapping("/courses/{id}/force-unpublish")
    public ResponseEntity<?> forceUnpublish(@PathVariable Integer id, @Valid @RequestBody ForceUnpublishRequest request) {
        return courseService.forceUnpublish(id, request.getReason());
    }
}
