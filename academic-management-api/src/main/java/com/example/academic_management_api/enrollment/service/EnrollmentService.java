package com.example.academic_management_api.enrollment.service;

import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.service.LessonService;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.dto.EnrollRequest;
import com.example.academic_management_api.enrollment.dto.EnrolledStudentDto;
import com.example.academic_management_api.enrollment.dto.MyCourseDto;
import com.example.academic_management_api.enrollment.dto.TeacherCourseStudentCountDto;
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
    private final LessonService lessonService;

    public EnrollmentService(
            EnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            CourseRepository courseRepository,
            LessonService lessonService
    ) {
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.lessonService = lessonService;
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

        return mapToEnrolledStudentDtos(courseId);
    }

    // Phase 31 — AdminCourses "Thu hồi quyền truy cập": Admin xem học viên của mọi course, không
    // qua ownership check (khác getStudentsByCourse của Teacher ở trên).
    public List<EnrolledStudentDto> getStudentsByCourseAsAdmin(Integer courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new NotFoundException("Không tìm thấy khóa học");
        }

        return mapToEnrolledStudentDtos(courseId);
    }

    private List<EnrolledStudentDto> mapToEnrolledStudentDtos(Integer courseId) {
        List<Enrollments> enrollments = enrollmentRepository.findByCourse_CourseIdWithStudent(courseId);
        List<Integer> studentIds = enrollments.stream().map(e -> e.getStudent().getUserId()).toList();
        Map<Integer, Integer> progressByStudentId = lessonService.getCompletionPercentByStudentIds(courseId, studentIds);

        return enrollments.stream()
                .map(e -> new EnrolledStudentDto(
                        e.getEnrollmentId(),
                        e.getStudent().getUsername(),
                        e.getStudent().getFullName(),
                        e.getEnrolledAt(),
                        e.getAccessRevokedAt(),
                        progressByStudentId.getOrDefault(e.getStudent().getUserId(), 0)
                ))
                .toList();
    }

    // Phase 35 — Dashboard "Tiến độ trung bình" (Phase 28 debt): trung bình % hoàn thành trên mọi
    // course Student hiện tại đã mua.
    public Integer getAverageProgressPercent(String username) {
        Users student = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));
        List<Integer> courseIds = enrollmentRepository.findByStudent_UserId(student.getUserId())
                .stream()
                .map(e -> e.getCourse().getCourseId())
                .toList();
        return lessonService.getAverageCompletionPercent(student.getUserId(), courseIds);
    }

    // Phase 30 — Teacher Dashboard (tổng học viên) + Teacher Courses List (cột Số học viên).
    public List<TeacherCourseStudentCountDto> getStudentCountsByTeacher(String teacherUsername) {
        return enrollmentRepository.countActiveStudentsGroupedByCourseForTeacher(teacherUsername);
    }

    // Phase 31 — AdminCourses "Số học viên" (tổng số đã mua, mọi course) — public entry point cho
    // CourseService gọi qua (module course không được đụng EnrollmentRepository trực tiếp, ADR
    // module boundary ở CLAUDE.md).
    public List<TeacherCourseStudentCountDto> getAllStudentCounts() {
        return enrollmentRepository.countAllStudentsGroupedByCourse();
    }

    @Audited(action = "ADMIN_ENROLLMENT_REVOKE_ACCESS", targetType = "ENROLLMENT", targetIdExpression = "#enrollmentId")
    public void revokeAccess(Integer enrollmentId, String reason) {
        Enrollments enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy enrollment"));

        enrollment.setAccessRevokedAt(LocalDateTime.now());
        enrollment.setAccessRevokedReason(reason);

        enrollmentRepository.save(enrollment);
    }
}
