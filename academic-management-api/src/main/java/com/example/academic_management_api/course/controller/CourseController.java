package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.course.dto.CourseResponseDto;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCoursesDto());
    }

    @GetMapping("/allDetail")
    public ResponseEntity<List<CourseResponseDto>> getAllCoursesDetail() {
        return ResponseEntity.ok(courseService.getAllCoursesDto());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(courseService.getCourseDetail(id));
    }

    @GetMapping("/course-detail")
    public Courses getClassDetail(@RequestParam Integer classId) {
        return courseService.getClassDetail(classId);
    }
}
