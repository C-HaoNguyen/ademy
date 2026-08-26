package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.application.port.ObjectStoragePort;
import com.example.academic_management_api.course.dto.PresignVideoRequest;
import com.example.academic_management_api.course.dto.PresignVideoResponse;
import com.example.academic_management_api.course.dto.TeacherCourseRequest;
import com.example.academic_management_api.course.entity.Courses;
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
    private final ObjectStoragePort objectStoragePort;

    public TeacherCourseController(CourseService courseService, ObjectStoragePort objectStoragePort) {
        this.courseService = courseService;
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
