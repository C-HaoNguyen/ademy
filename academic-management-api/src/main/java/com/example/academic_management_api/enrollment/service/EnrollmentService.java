package com.example.academic_management_api.enrollment.service;

import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.dto.EnrollRequest;
import com.example.academic_management_api.enrollment.entity.Enrollments;
import com.example.academic_management_api.enrollment.repository.EnrollmentRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public EnrollmentService(
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            CourseRepository courseRepository
    ) {
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    public ResponseEntity<?> enroll(EnrollRequest request, String username) {
        // Check course tồn tại
        Courses course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));

        // Check student tồn tại
        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));

        Integer studentId = student.getUserId();

        // Check đã đăng ký chưa
        boolean existed = enrollmentRepository
                .existsByStudent_UserIdAndCourse_CourseId(
                        studentId,
                        course.getCourseId()
                );

        if (existed) {
            throw new ConflictException("Đã đăng ký khóa học này");
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

    public List<Courses> getMyCourses(String username) {
        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));

        return enrollmentRepository
                .findByStudent_UserIdWithCourse(student.getUserId())
                .stream()
                .map(Enrollments::getCourse)
                .toList();
    }

    public long getStudentTotalCourses(String username) {
        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));

        return enrollmentRepository
                .countByStudent_UserId(student.getUserId());
    }

    public boolean isEnrolled(Integer studentId, Integer courseId) {
        return enrollmentRepository
                .existsByStudent_UserIdAndCourse_CourseId(studentId, courseId);
    }

    public Enrollments createEnrollment(Users student, Courses course) {
        Enrollments enrollment = new Enrollments();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        return enrollmentRepository.save(enrollment);
    }
}
