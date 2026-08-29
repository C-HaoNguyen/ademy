package com.example.academic_management_api.course.lesson.service;

import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.common.exception.ForbiddenException;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.CourseStatus;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.dto.LessonPreviewDto;
import com.example.academic_management_api.course.lesson.dto.LessonRequest;
import com.example.academic_management_api.course.lesson.entity.LessonContentType;
import com.example.academic_management_api.course.lesson.entity.Lessons;
import com.example.academic_management_api.course.lesson.repository.LessonRepository;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LessonService {

    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public LessonService(LessonRepository lessonRepository, CourseRepository courseRepository, UserRepository userRepository) {
        this.lessonRepository = lessonRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
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
}
