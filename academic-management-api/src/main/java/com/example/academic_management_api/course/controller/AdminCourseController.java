package com.example.academic_management_api.course.controller;

import com.example.academic_management_api.course.dto.CreateCourseRequest;
import com.example.academic_management_api.course.dto.RecentlyPublishedCourseDto;
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

    // Phase 29 — AdminDashboard danh sách rút gọn (top 5 course PUBLISHED mới cập nhật gần nhất).
    @GetMapping("/courses/recently-published")
    public List<RecentlyPublishedCourseDto> getRecentlyPublishedCourses() {
        return courseService.getRecentlyPublished(5);
    }

    /**
     * @deprecated Admin CRUD trực tiếp course sẽ bị thay bằng Teacher Course Editor
     * (Phase 30) + Admin chỉ giám sát/force-unpublish (Phase 31). Giữ lại cho tới hết
     * Phase 31 để không breaking frontend Admin hiện có (Phase 18).
     */
    @Deprecated
    @PostMapping("/courses/add")
    public ResponseEntity<?> createCourse(
            @Valid @RequestBody CreateCourseRequest request
    ) {
        return courseService.createCourse(request);
    }

    /**
     * @deprecated xem {@link #createCourse(CreateCourseRequest)}.
     */
    @Deprecated
    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Integer id,
            @Valid @RequestBody CreateCourseRequest request
    ) {
        return courseService.updateCourse(id, request);
    }

    /**
     * @deprecated xem {@link #createCourse(CreateCourseRequest)}.
     */
    @Deprecated
    @DeleteMapping("/deleted-course/{courseId}")
    public void deleteCourse(@PathVariable Integer courseId) {
        courseService.deleteCourse(courseId);
    }

    @PostMapping("/courses/{id}/force-unpublish")
    public ResponseEntity<?> forceUnpublish(@PathVariable Integer id) {
        return courseService.forceUnpublish(id);
    }
}
