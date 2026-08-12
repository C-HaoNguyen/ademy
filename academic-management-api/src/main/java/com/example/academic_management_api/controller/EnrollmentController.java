package com.example.academic_management_api.controller;

import com.example.academic_management_api.dto.EnrollRequest;
import com.example.academic_management_api.entity.Courses;
import com.example.academic_management_api.entity.Enrollments;
import com.example.academic_management_api.entity.Users;
import com.example.academic_management_api.repository.CourseRepository;
import com.example.academic_management_api.repository.EnrollmentRepository;
import com.example.academic_management_api.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/enrollments")
public class EnrollmentController {
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public EnrollmentController(
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            CourseRepository courseRepository
    ) {
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    @PostMapping
    public ResponseEntity<?> enroll(@RequestBody EnrollRequest request, Authentication authentication) {
        // Lấy studentId từ JWT
        String username = authentication.getName();

        // Check course tồn tại
        Courses course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));

        // Check student tồn tại
        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Integer studentId = student.getUserId();

        // Check đã đăng ký chưa
        boolean existed = enrollmentRepository
                .existsByStudent_UserIdAndCourse_CourseId(
                        studentId,
                        course.getCourseId()
                );

        if (existed) {
            return ResponseEntity
                    .status(409)
                    .body("Đã đăng ký khóa học này");
        }

        // Tạo enrollment
        Enrollments enrollment = new Enrollments();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        enrollmentRepository.save(enrollment);

        return ResponseEntity.ok(
                Map.of("message", "ENROLL_SUCCESS")
        );
    }

    @GetMapping("/student/me/courses")
    public ResponseEntity<?> getMyCourses(Authentication authentication) {
        String username = authentication.getName();

        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Courses> courses = enrollmentRepository
                .findByStudent_UserId(student.getUserId())
                .stream()
                .map(Enrollments::getCourse)
                .toList();

        return ResponseEntity.ok(courses);
    }

    @GetMapping("/student/me/summary")
    public ResponseEntity<?> getStudentDashboardSummary(Authentication authentication) {

        String username = authentication.getName();

        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        long totalCourses = enrollmentRepository
                .countByStudent_UserId(student.getUserId());

        return ResponseEntity.ok(
                Map.of("totalCourses", totalCourses)
        );
    }
}
