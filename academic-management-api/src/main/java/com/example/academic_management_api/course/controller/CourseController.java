package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.course.dto.CourseResponseDto;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.dto.LessonPreviewDto;
import com.example.academic_management_api.course.lesson.service.LessonService;
import com.example.academic_management_api.course.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseService courseService;
    private final LessonService lessonService;

    public CourseController(CourseService courseService, LessonService lessonService) {
        this.courseService = courseService;
        this.lessonService = lessonService;
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

    @GetMapping("/{id}/lessons")
    public ResponseEntity<List<LessonPreviewDto>> getPreviewLessons(@PathVariable Integer id) {
        return ResponseEntity.ok(lessonService.getPublicPreviewLessons(id));
    }
}
