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
import com.example.academic_management_api.user.entity.Role;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LessonServiceTest {

    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private UserRepository userRepository;

    private LessonService lessonService;

    @BeforeEach
    void setUp() {
        lessonService = new LessonService(lessonRepository, courseRepository, userRepository);
    }

    private Users user(int id, String username) {
        Users u = new Users();
        u.setUserId(id);
        u.setUsername(username);
        u.setRole(Role.TEACHER);
        return u;
    }

    private Courses course(int id, Users instructor) {
        Courses c = new Courses();
        c.setCourseId(id);
        c.setInstructor(instructor);
        return c;
    }

    private LessonRequest request(LessonContentType type, String videoUrl) {
        LessonRequest r = new LessonRequest();
        setField(r, "title", "Bài 1");
        setField(r, "content", "Nội dung");
        setField(r, "orderIndex", 1);
        setField(r, "duration", 10);
        setField(r, "isPreview", false);
        setField(r, "contentType", type);
        setField(r, "videoUrl", videoUrl);
        return r;
    }

    @Test
    void createLesson_teacherNotOwner_throwsForbidden() {
        Users teacherA = user(1, "teacherA");
        Users teacherB = user(2, "teacherB");
        Courses course = course(10, teacherA);

        when(userRepository.findByUsername("teacherB")).thenReturn(Optional.of(teacherB));
        when(courseRepository.findById(10)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> lessonService.createLesson(10, request(LessonContentType.DOCUMENT, null), "teacherB"))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(lessonRepository);
    }

    @Test
    void createLesson_videoTypeWithoutVideoUrl_throwsConflict() {
        Users teacher = user(1, "teacherA");
        Courses course = course(10, teacher);

        when(userRepository.findByUsername("teacherA")).thenReturn(Optional.of(teacher));
        when(courseRepository.findById(10)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> lessonService.createLesson(10, request(LessonContentType.VIDEO, null), "teacherA"))
                .isInstanceOf(ConflictException.class);

        verify(lessonRepository, never()).save(any());
    }

    @Test
    void createLesson_documentTypeWithVideoUrl_throwsConflict() {
        Users teacher = user(1, "teacherA");
        Courses course = course(10, teacher);

        when(userRepository.findByUsername("teacherA")).thenReturn(Optional.of(teacher));
        when(courseRepository.findById(10)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> lessonService.createLesson(10, request(LessonContentType.DOCUMENT, "https://video.example.com/x.mp4"), "teacherA"))
                .isInstanceOf(ConflictException.class);

        verify(lessonRepository, never()).save(any());
    }

    @Test
    void createLesson_ownerWithValidVideoRequest_savesLesson() {
        Users teacher = user(1, "teacherA");
        Courses course = course(10, teacher);

        when(userRepository.findByUsername("teacherA")).thenReturn(Optional.of(teacher));
        when(courseRepository.findById(10)).thenReturn(Optional.of(course));
        when(lessonRepository.save(any(Lessons.class))).thenAnswer(inv -> inv.getArgument(0));

        Lessons saved = lessonService.createLesson(10, request(LessonContentType.VIDEO, "https://video.example.com/x.mp4"), "teacherA");

        assertThat(saved.getContentType()).isEqualTo(LessonContentType.VIDEO);
        assertThat(saved.getVideoUrl()).isEqualTo("https://video.example.com/x.mp4");
        assertThat(saved.getCourse()).isEqualTo(course);
    }

    @Test
    void getPublicPreviewLessons_filtersOutNonPreviewLessons() {
        Courses course = course(10, user(1, "teacherA"));
        course.setStatus(CourseStatus.PUBLISHED);

        Lessons preview = new Lessons();
        preview.setLessonId(1);
        preview.setTitle("Preview");
        preview.setPreview(true);
        preview.setOrderIndex(1);

        Lessons locked = new Lessons();
        locked.setLessonId(2);
        locked.setTitle("Locked");
        locked.setPreview(false);
        locked.setOrderIndex(2);

        when(courseRepository.findById(10)).thenReturn(Optional.of(course));
        when(lessonRepository.findByCourse_CourseIdOrderByOrderIndexAsc(10)).thenReturn(List.of(preview, locked));

        List<LessonPreviewDto> result = lessonService.getPublicPreviewLessons(10);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getLessonId()).isEqualTo(1);
    }

    @Test
    void getPublicPreviewLessons_courseNotPublished_throwsNotFound() {
        Courses course = course(10, user(1, "teacherA"));
        course.setStatus(CourseStatus.DRAFT);

        when(courseRepository.findById(10)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> lessonService.getPublicPreviewLessons(10))
                .isInstanceOf(NotFoundException.class);

        verifyNoInteractions(lessonRepository);
    }

    private void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }
}
