package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.course.dto.TeacherCourseRequest;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teacher/courses")
public class TeacherCourseController {

    private final CourseService courseService;

    public TeacherCourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<List<Courses>> getOwnCourses(Authentication authentication) {
        return ResponseEntity.ok(courseService.getOwnCourses(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Courses> getOwnCourseDetail(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(courseService.getOwnCourseDetail(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<?> createOwnCourse(
            @Valid @RequestBody TeacherCourseRequest request,
            Authentication authentication
    ) {
        return courseService.createOwnCourse(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOwnCourse(
            @PathVariable Integer id,
            @Valid @RequestBody TeacherCourseRequest request,
            Authentication authentication
    ) {
        return courseService.updateOwnCourse(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public void deleteOwnCourse(@PathVariable Integer id, Authentication authentication) {
        courseService.deleteOwnCourse(id, authentication.getName());
    }
}
