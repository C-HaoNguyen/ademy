package com.example.academic_management_api.enrollment.service;

import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.dto.EnrollRequest;
import com.example.academic_management_api.enrollment.dto.EnrolledStudentDto;
import com.example.academic_management_api.enrollment.dto.MyCourseDto;
import com.example.academic_management_api.enrollment.entity.Enrollments;
import com.example.academic_management_api.enrollment.repository.EnrollmentRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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

    public List<MyCourseDto> getMyCourses(String username) {
        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));

        return enrollmentRepository
                .findByStudent_UserIdWithCourse(student.getUserId())
                .stream()
                .map(e -> new MyCourseDto(
                        e.getCourse().getCourseId(),
                        e.getCourse().getTitle(),
                        e.getCourse().getThumbnail(),
                        e.getCourse().getInstructor().getFullName(),
                        e.getEnrolledAt()
                ))
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
                .existsByStudent_UserIdAndCourse_CourseIdAndAccessRevokedAtIsNull(studentId, courseId);
    }

    public Enrollments createEnrollment(Users student, Courses course) {
        Enrollments enrollment = new Enrollments();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        return enrollmentRepository.save(enrollment);
    }

    public List<EnrolledStudentDto> getStudentsByCourse(Integer courseId, String teacherUsername) {
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));

        if (!course.getInstructor().getUsername().equals(teacherUsername)) {
            throw new ForbiddenException("Bạn không có quyền xem học viên của khóa học này");
        }

        return enrollmentRepository.findByCourse_CourseIdWithStudent(courseId)
                .stream()
                .map(e -> new EnrolledStudentDto(
                        e.getEnrollmentId(),
                        e.getStudent().getUsername(),
                        e.getStudent().getFullName(),
                        e.getEnrolledAt()
                ))
                .toList();
    }

    public void revokeAccess(Integer enrollmentId, String reason) {
        Enrollments enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy enrollment"));

        enrollment.setAccessRevokedAt(LocalDateTime.now());
        enrollment.setAccessRevokedReason(reason);

        enrollmentRepository.save(enrollment);
    }
}
