package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.course.dto.CreateCourseRequest;
import com.example.academic_management_api.course.entity.Courses;
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
    public List<Courses> getAllCourses() {
        return courseService.getAllCourses();
    }

    @GetMapping("/total-courses")
    public ResponseEntity<?> getTotalCourses(Authentication authentication) {
        long totalCourses = courseService.getTotalCourses();

        return ResponseEntity.ok(
                Map.of("totalCourses", totalCourses)
        );
    }

    @PostMapping("/courses/add")
    public ResponseEntity<?> createCourse(
            @Valid @RequestBody CreateCourseRequest request
    ) {
        return courseService.createCourse(request);
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Integer id,
            @Valid @RequestBody CreateCourseRequest request
    ) {
        return courseService.updateCourse(id, request);
    }

    @DeleteMapping("/deleted-course/{courseId}")
    public void deleteCourse(@PathVariable Integer courseId) {
        courseService.deleteCourse(courseId);
    }
}
