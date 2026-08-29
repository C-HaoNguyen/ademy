package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.application.port.ObjectStoragePort;
import com.example.academic_management_api.course.dto.PresignVideoRequest;
import com.example.academic_management_api.course.dto.PresignVideoResponse;
import com.example.academic_management_api.course.dto.TeacherCourseRequest;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.dto.LessonRequest;
import com.example.academic_management_api.course.lesson.entity.Lessons;
import com.example.academic_management_api.course.lesson.service.LessonService;
import com.example.academic_management_api.course.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/teacher/courses")
public class TeacherCourseController {

    private final CourseService courseService;
    private final LessonService lessonService;
    private final ObjectStoragePort objectStoragePort;

    public TeacherCourseController(CourseService courseService, LessonService lessonService, ObjectStoragePort objectStoragePort) {
        this.courseService = courseService;
        this.lessonService = lessonService;
        this.objectStoragePort = objectStoragePort;
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

    @GetMapping("/{courseId}/lessons")
    public ResponseEntity<List<Lessons>> getOwnLessons(@PathVariable Integer courseId, Authentication authentication) {
        return ResponseEntity.ok(lessonService.getOwnLessons(courseId, authentication.getName()));
    }

    @PostMapping("/{courseId}/lessons")
    public ResponseEntity<Lessons> createLesson(
            @PathVariable Integer courseId,
            @Valid @RequestBody LessonRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(lessonService.createLesson(courseId, request, authentication.getName()));
    }

    @PutMapping("/{courseId}/lessons/{lessonId}")
    public ResponseEntity<Lessons> updateLesson(
            @PathVariable Integer courseId,
            @PathVariable Integer lessonId,
            @Valid @RequestBody LessonRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(lessonService.updateLesson(courseId, lessonId, request, authentication.getName()));
    }

    @DeleteMapping("/{courseId}/lessons/{lessonId}")
    public void deleteLesson(@PathVariable Integer courseId, @PathVariable Integer lessonId, Authentication authentication) {
        lessonService.deleteLesson(courseId, lessonId, authentication.getName());
    }

    @PostMapping("/{courseId}/lessons/{lessonId}/video/presign")
    public ResponseEntity<PresignVideoResponse> presignLessonVideo(
            @PathVariable Integer courseId,
            @PathVariable Integer lessonId,
            @Valid @RequestBody PresignVideoRequest request,
            Authentication authentication
    ) {
        courseService.getOwnCourseDetail(courseId, authentication.getName());

        String objectKey = "courses/%d/lessons/%d/video/%s".formatted(courseId, lessonId, UUID.randomUUID());
        ObjectStoragePort.PresignedUpload presigned =
                objectStoragePort.generatePresignedUploadUrl(objectKey, request.getContentType());

        return ResponseEntity.ok(new PresignVideoResponse(
                presigned.uploadUrl(),
                presigned.objectKey(),
                presigned.publicUrl(),
                presigned.expiresAt()
        ));
    }
}
