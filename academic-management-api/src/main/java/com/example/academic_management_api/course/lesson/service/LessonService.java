package com.example.academic_management_api.course.lesson.service;

import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.CourseStatus;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.dto.CourseLessonCountDto;
import com.example.academic_management_api.course.lesson.dto.LessonPreviewDto;
import com.example.academic_management_api.course.lesson.dto.LessonRequest;
import com.example.academic_management_api.course.lesson.dto.StudentCourseLessonsDto;
import com.example.academic_management_api.course.lesson.dto.StudentLessonCompletionCountDto;
import com.example.academic_management_api.course.lesson.dto.StudentLessonDto;
import com.example.academic_management_api.course.lesson.entity.LessonContentType;
import com.example.academic_management_api.course.lesson.entity.LessonProgress;
import com.example.academic_management_api.course.lesson.entity.Lessons;
import com.example.academic_management_api.course.lesson.repository.LessonProgressRepository;
import com.example.academic_management_api.course.lesson.repository.LessonRepository;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final EnrollmentService enrollmentService;

    // @Lazy phá vòng phụ thuộc vòng tròn: LessonService cần EnrollmentService.isEnrolled() để chặn
    // truy cập nội dung lesson (BR-007), còn EnrollmentService cần LessonService.* để tính
    // progressPercent (EnrolledStudentDto — trả nợ Phase 18, và Dashboard trung bình tiến độ).
    public LessonService(
            LessonRepository lessonRepository,
            CourseRepository courseRepository,
            UserRepository userRepository,
            LessonProgressRepository lessonProgressRepository,
            @Lazy EnrollmentService enrollmentService
    ) {
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.enrollmentService = enrollmentService;
    }

    private Users getTeacher(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giảng viên"));
    }

    private Courses getOwnedCourse(Integer courseId, String username) {
        Users teacher = getTeacher(username);
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));
        if (!course.getInstructor().getUserId().equals(teacher.getUserId())) {
            throw new ForbiddenException("Bạn không có quyền thao tác trên khóa học này");
        }
        return course;
    }

    public Lessons getOwnedLesson(Integer courseId, Integer lessonId, String username) {
        Courses course = getOwnedCourse(courseId, username);
        Lessons lesson = lessonRepository.findByIdWithCourse(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));
        if (!lesson.getCourse().getCourseId().equals(course.getCourseId())) {
            throw new NotFoundException("Không tìm thấy lesson");
        }
        return lesson;
    }

    private void validateContentType(LessonRequest request) {
        boolean hasVideoUrl = request.getVideoUrl() != null && !request.getVideoUrl().isBlank();
        if (request.getContentType() == LessonContentType.VIDEO && !hasVideoUrl) {
            throw new ConflictException("Lesson loại video phải có videoUrl");
        }
        if (request.getContentType() != LessonContentType.VIDEO && hasVideoUrl) {
            throw new ConflictException("Chỉ lesson loại video mới được có videoUrl");
        }
    }

    private void applyRequest(Lessons lesson, LessonRequest request) {
        lesson.setTitle(request.getTitle());
        lesson.setContent(request.getContent());
        lesson.setOrderIndex(request.getOrderIndex());
        lesson.setDuration(request.getDuration());
        lesson.setPreview(request.getIsPreview() != null && request.getIsPreview());
        lesson.setContentType(request.getContentType());
        lesson.setVideoUrl(request.getVideoUrl());
    }

    public List<Lessons> getOwnLessons(Integer courseId, String username) {
        getOwnedCourse(courseId, username);
        return lessonRepository.findByCourse_CourseIdOrderByOrderIndexAsc(courseId);
    }

    public Lessons createLesson(Integer courseId, LessonRequest request, String username) {
        Courses course = getOwnedCourse(courseId, username);
        validateContentType(request);

        Lessons lesson = new Lessons();
        lesson.setCourse(course);
        applyRequest(lesson, request);
        return lessonRepository.save(lesson);
    }

    public Lessons updateLesson(Integer courseId, Integer lessonId, LessonRequest request, String username) {
        Lessons lesson = getOwnedLesson(courseId, lessonId, username);
        validateContentType(request);
        applyRequest(lesson, request);
        return lessonRepository.save(lesson);
    }

    public void deleteLesson(Integer courseId, Integer lessonId, String username) {
        Lessons lesson = getOwnedLesson(courseId, lessonId, username);
        lessonRepository.delete(lesson);
    }

    public List<LessonPreviewDto> getPublicPreviewLessons(Integer courseId) {
        Courses course = courseRepository.findById(courseId)
                .filter(c -> c.getStatus() == CourseStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));
        return lessonRepository.findByCourse_CourseIdOrderByOrderIndexAsc(course.getCourseId())
                .stream()
                .filter(l -> Boolean.TRUE.equals(l.getPreview()))
                .map(LessonPreviewDto::new)
                .toList();
    }

    // Đọc thuần cho module khác (assessment) — không có ownership check, dùng cho luồng Student.
    public Lessons getLessonWithCourse(Integer lessonId) {
        return lessonRepository.findByIdWithCourse(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));
    }

    // Dùng cho CourseService validate publish (Phase 30) — không có ownership check, caller tự đảm bảo
    // đã verify ownership course trước đó.
    public boolean hasAnyLesson(Integer courseId) {
        return lessonRepository.existsByCourse_CourseId(courseId);
    }

    // ---- Phase 35: Lesson Player (Student) ----

    private Users getStudent(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học viên"));
    }

    public StudentCourseLessonsDto getLessonsForStudent(Integer courseId, String username) {
        Users student = getStudent(username);
        Courses course = courseRepository.findById(courseId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));
        boolean enrolled = enrollmentService.isEnrolled(student.getUserId(), courseId);

        List<Lessons> lessons = lessonRepository.findByCourse_CourseIdOrderByOrderIndexAsc(courseId);
        Set<Integer> completedLessonIds = lessonProgressRepository
                .findByStudent_UserIdAndLesson_Course_CourseId(student.getUserId(), courseId)
                .stream()
                .filter(p -> Boolean.TRUE.equals(p.getCompleted()))
                .map(p -> p.getLesson().getLessonId())
                .collect(Collectors.toSet());

        // BR-007: course chưa mua chỉ thấy lesson isPreview=true; nội dung đầy đủ (content/videoUrl)
        // trả kèm luôn trong list này (không có endpoint GET 1 lesson riêng) để chuyển lesson trong
        // sidebar không cần gọi lại API — chỉ đổi state ở frontend.
        List<StudentLessonDto> lessonDtos = lessons.stream()
                .filter(l -> enrolled || Boolean.TRUE.equals(l.getPreview()))
                .map(l -> new StudentLessonDto(l, completedLessonIds.contains(l.getLessonId())))
                .toList();

        int progressPercent = enrolled && !lessons.isEmpty()
                ? (int) Math.round(completedLessonIds.size() * 100.0 / lessons.size())
                : 0;

        return new StudentCourseLessonsDto(course.getCourseId(), course.getTitle(), lessonDtos, progressPercent, enrolled);
    }

    // Đánh dấu hoàn thành đòi hỏi enrollment thật (khác preview cho phép xem) — preview không tính
    // là "đang học" khóa học, không nên ghi LessonProgress.
    @Transactional
    public StudentLessonDto markLessonComplete(Integer lessonId, String username) {
        Users student = getStudent(username);
        Lessons lesson = lessonRepository.findByIdWithCourse(lessonId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lesson"));
        if (!enrollmentService.isEnrolled(student.getUserId(), lesson.getCourse().getCourseId())) {
            throw new ForbiddenException("Bạn chưa mua khóa học này");
        }

        LessonProgress progress = lessonProgressRepository
                .findByStudent_UserIdAndLesson_LessonId(student.getUserId(), lessonId)
                .orElseGet(() -> {
                    LessonProgress p = new LessonProgress();
                    p.setStudent(student);
                    p.setLesson(lesson);
                    return p;
                });
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        try {
            lessonProgressRepository.save(progress);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Tiến độ bài học đang được cập nhật bởi request khác, vui lòng thử lại");
        }
        return new StudentLessonDto(lesson, true);
    }

    // ---- Phase 35: progressPercent cho enrollment module (trả nợ Phase 18 + Dashboard) ----

    // Teacher "Học viên" tab (Phase 18/30) — % hoàn thành của từng student trong 1 course cụ thể.
    public Map<Integer, Integer> getCompletionPercentByStudentIds(Integer courseId, List<Integer> studentIds) {
        if (studentIds.isEmpty()) {
            return Map.of();
        }
        long totalLessons = lessonRepository.countByCourse_CourseId(courseId);
        if (totalLessons == 0) {
            return studentIds.stream().collect(Collectors.toMap(id -> id, id -> 0));
        }
        Map<Integer, Long> completedByStudentId = lessonProgressRepository
                .countCompletedGroupedByStudentForCourse(courseId)
                .stream()
                .collect(Collectors.toMap(
                        StudentLessonCompletionCountDto::getStudentId,
                        StudentLessonCompletionCountDto::getCompletedCount
                ));
        return studentIds.stream().collect(Collectors.toMap(
                id -> id,
                id -> (int) Math.round(completedByStudentId.getOrDefault(id, 0L) * 100.0 / totalLessons)
        ));
    }

    // Dashboard "Tiến độ trung bình" (Phase 28 debt) — trung bình % hoàn thành trên các course đã
    // mua có ít nhất 1 lesson; null nếu không có course nào đủ điều kiện tính (chưa có lesson nào).
    // 2 query tổng (không phụ thuộc số lượng course) thay vì lặp N course x 2 query/course.
    public Integer getAverageCompletionPercent(Integer studentId, List<Integer> courseIds) {
        if (courseIds.isEmpty()) {
            return null;
        }

        Map<Integer, Long> totalByCourseId = lessonRepository.countGroupedByCourseIds(courseIds)
                .stream()
                .collect(Collectors.toMap(CourseLessonCountDto::getCourseId, CourseLessonCountDto::getCount));
        Map<Integer, Long> completedByCourseId = lessonProgressRepository
                .countCompletedGroupedByCourseForStudent(studentId, courseIds)
                .stream()
                .collect(Collectors.toMap(CourseLessonCountDto::getCourseId, CourseLessonCountDto::getCount));

        List<Integer> percents = courseIds.stream()
                .filter(courseId -> totalByCourseId.getOrDefault(courseId, 0L) > 0)
                .map(courseId -> {
                    long total = totalByCourseId.get(courseId);
                    long completed = completedByCourseId.getOrDefault(courseId, 0L);
                    return (int) Math.round(completed * 100.0 / total);
                })
                .toList();

        if (percents.isEmpty()) {
            return null;
        }
        return (int) Math.round(percents.stream().mapToInt(Integer::intValue).average().orElse(0));
    }
}
