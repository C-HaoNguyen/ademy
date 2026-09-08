package com.example.academic_management_api.course.service;

import com.example.academic_management_api.audit.annotation.Audited;
import com.example.academic_management_api.category.entity.Categories;
import com.example.academic_management_api.category.repository.CategoryRepository;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.dto.AdminCourseListDto;
import com.example.academic_management_api.course.dto.CourseResponseDto;
import com.example.academic_management_api.course.dto.RecentlyPublishedCourseDto;
import com.example.academic_management_api.course.dto.TeacherCourseRequest;
import com.example.academic_management_api.course.entity.CourseStatus;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.service.LessonService;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.dto.TeacherCourseStudentCountDto;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final LessonService lessonService;
    private final EnrollmentService enrollmentService;

    public CourseService(
            CourseRepository courseRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            LessonService lessonService,
            EnrollmentService enrollmentService
    ) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.lessonService = lessonService;
        this.enrollmentService = enrollmentService;
    }

    private CourseResponseDto mapToDto(Courses course) {
        return new CourseResponseDto(
                course.getCourseId(),
                course.getTitle(),
                course.getDescription(),
                course.getPrice(),
                course.getCreatedAt(),
                course.getThumbnail(),
                course.getLevel(),

                // instructor
                course.getInstructor().getUsername(),
                course.getInstructor().getFullName(),

                // category
                course.getCategory().getCategoryId(),
                course.getCategory().getCategoryName()
        );
    }

    public List<CourseResponseDto> getAllCoursesDto() {
        List<Courses> courses = courseRepository.findAllPublishedWithDetails();
        List<CourseResponseDto> response = new ArrayList<>();

        for (Courses course : courses) {
            response.add(mapToDto(course));
        }

        return response;
    }

    public CourseResponseDto getCourseDetail(Integer id) {
        Courses course = courseRepository.findById(id)
                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        return mapToDto(course);
    }

    public Courses getClassDetail(Integer classId) {
        return courseRepository.findById(classId).orElse(null);
    }

    // ---- Admin operations ----

    // Phase 31 — Admin chuyển sang giám sát (không còn CRUD trực tiếp), bảng khớp UI_SPEC §5.3.
    public List<AdminCourseListDto> getAllCourses() {
        List<Courses> courses = courseRepository.findAllWithDetails();

        Map<Integer, Long> studentCountByCourseId = new HashMap<>();
        for (TeacherCourseStudentCountDto count : enrollmentService.getAllStudentCounts()) {
            studentCountByCourseId.put(count.getCourseId(), count.getStudentCount());
        }

        List<AdminCourseListDto> response = new ArrayList<>();
        for (Courses course : courses) {
            response.add(new AdminCourseListDto(
                    course.getCourseId(),
                    course.getTitle(),
                    course.getStatus(),
                    course.getInstructor().getFullName(),
                    studentCountByCourseId.getOrDefault(course.getCourseId(), 0L),
                    course.getPublishedAt(),
                    course.getCategory() != null ? course.getCategory().getCategoryId() : null
            ));
        }
        return response;
    }

    public long getTotalCourses() {
        return courseRepository.count();
    }

    // Phase 29 — AdminDashboard danh sách rút gọn "Khóa học mới publish gần đây".
    public List<RecentlyPublishedCourseDto> getRecentlyPublished(int limit) {
        return courseRepository.findPublishedOrderByUpdatedAtDesc(PageRequest.of(0, limit))
                .stream()
                .map(c -> new RecentlyPublishedCourseDto(
                        c.getCourseId(),
                        c.getTitle(),
                        c.getThumbnail(),
                        c.getInstructor().getFullName(),
                        c.getUpdatedAt()
                ))
                .toList();
    }

    @Audited(action = "ADMIN_COURSE_FORCE_UNPUBLISH", targetType = "COURSE", targetIdExpression = "#courseId")
    public ResponseEntity<?> forceUnpublish(Integer courseId, String reason) {
        Courses course = courseRepository.findByIdWithDetails(courseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));

        course.setStatus(CourseStatus.ARCHIVED);
        // Phase 31 — chặn Teacher tự publish lại (BR-005: chỉ ẩn khỏi catalog, không đụng enrollment).
        course.setAdminLocked(true);
        course.setForceUnpublishReason(reason);
        Courses saved = courseRepository.save(course);

        return ResponseEntity.ok(saved);
    }

    // ---- Teacher operations (ownership-scoped, ADR-008) ----

    private Users getTeacher(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giảng viên"));
    }

    private void assertOwnership(Courses course, Integer teacherUserId) {
        if (!course.getInstructor().getUserId().equals(teacherUserId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên khóa học này");
        }
    }

    public List<Courses> getOwnCourses(String username) {
        Users teacher = getTeacher(username);
        return courseRepository.findByInstructor_UserId(teacher.getUserId());
    }

    public Courses getOwnCourseDetail(Integer courseId, String username) {
        Users teacher = getTeacher(username);
        Courses course = courseRepository.findByIdWithDetails(courseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));
        assertOwnership(course, teacher.getUserId());
        return course;
    }

    @Audited(action = "TEACHER_COURSE_CREATE", targetType = "COURSE", targetIdExpression = "#result.body.courseId")
    public ResponseEntity<?> createOwnCourse(TeacherCourseRequest request, String username) {
        Users teacher = getTeacher(username);

        if (request.getCategoryId() == null) {
            return ResponseEntity.badRequest()
                    .body("Danh mục không được để trống");
        }

        // Course vừa tạo chưa thể có lesson nào — không cho publish ngay lúc tạo (UI_SPEC §4.3).
        if (request.getStatus() == CourseStatus.PUBLISHED) {
            throw new ConflictException("Không thể publish khóa học chưa có nội dung (lesson)");
        }

        Categories category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));

        Courses course = new Courses();
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(teacher);
        course.setCategory(category);
        course.setThumbnail(request.getThumbnail());
        course.setPrice(request.getPrice());
        course.setLevel(request.getLevel());
        course.setStatus(
                request.getStatus() != null ? request.getStatus() : CourseStatus.DRAFT
        );

        Courses savedCourse = courseRepository.save(course);

        return ResponseEntity.ok(savedCourse);
    }

    @Audited(action = "TEACHER_COURSE_UPDATE", targetType = "COURSE", targetIdExpression = "#courseId")
    public ResponseEntity<?> updateOwnCourse(Integer courseId, TeacherCourseRequest request, String username) {
        Users teacher = getTeacher(username);
        Courses course = courseRepository.findByIdWithDetails(courseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));
        assertOwnership(course, teacher.getUserId());

        if (request.getCategoryId() == null) {
            return ResponseEntity.badRequest()
                    .body("Danh mục không được để trống");
        }

        // UI_SPEC §4.3: publish thất bại nếu curriculum rỗng.
        if (request.getStatus() == CourseStatus.PUBLISHED && !lessonService.hasAnyLesson(courseId)) {
            throw new ConflictException("Không thể publish khóa học chưa có nội dung (lesson)");
        }

        // Phase 31 — course đã bị Admin force-unpublish không được Teacher tự publish lại.
        if (request.getStatus() == CourseStatus.PUBLISHED && course.isAdminLocked()) {
            throw new ForbiddenException("Khóa học đã bị Admin khóa, không thể tự publish lại");
        }

        Categories category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));

        CourseStatus newStatus = request.getStatus() != null ? request.getStatus() : course.getStatus();
        if (newStatus == CourseStatus.PUBLISHED && course.getStatus() != CourseStatus.PUBLISHED) {
            course.setPublishedAt(LocalDateTime.now());
        }

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(teacher);
        course.setCategory(category);
        course.setThumbnail(request.getThumbnail());
        course.setPrice(request.getPrice());
        course.setLevel(request.getLevel());
        course.setStatus(newStatus);

        Courses saved = courseRepository.save(course);

        return ResponseEntity.ok(saved);
    }

    @Audited(action = "TEACHER_COURSE_DELETE", targetType = "COURSE", targetIdExpression = "#courseId")
    public void deleteOwnCourse(Integer courseId, String username) {
        Users teacher = getTeacher(username);
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));
        assertOwnership(course, teacher.getUserId());

        courseRepository.deleteById(courseId);
    }
}
