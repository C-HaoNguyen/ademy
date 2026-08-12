package com.example.academic_management_api.controller;

import com.example.academic_management_api.dto.course.CourseResponseDto;
import com.example.academic_management_api.entity.Courses;
import com.example.academic_management_api.repository.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    private CourseResponseDto mapToDto(Courses course) {
        return new CourseResponseDto(
                course.getCourseId(),
                course.getTitle(),
                course.getDescription(),
                course.getPrice(),
                course.getCreatedAt(),
                course.getThumbnail(),

                // instructor
                course.getInstructor().getUsername(),
                course.getInstructor().getFullName(),

                // category
                course.getCategory().getCategoryId(),
                course.getCategory().getCategoryName()
        );
    }

    @GetMapping
    public ResponseEntity<List<CourseResponseDto>> getAllCourses() {

        List<Courses> courses = courseRepository.findAll();
        List<CourseResponseDto> response = new ArrayList<>();

        for (Courses course : courses) {
            response.add(mapToDto(course));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/allDetail")
    public ResponseEntity<List<CourseResponseDto>> getAllCoursesDetail() {

        List<Courses> courses = courseRepository.findAll();
        List<CourseResponseDto> response = new ArrayList<>();

        for (Courses course : courses) {
            response.add(mapToDto(course));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponseDto> getCourseDetail(@PathVariable Integer id) {
        Courses course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        return ResponseEntity.ok(mapToDto(course));
    }

    @GetMapping("/course-detail")
    public Courses getClassDetail(@RequestParam Integer classId) {
        return courseRepository.findById(classId).orElse(null);
    }
}
