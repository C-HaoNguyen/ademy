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
import com.example.academic_management_api.course.lesson.dto.StudentLessonDto;
import com.example.academic_management_api.course.lesson.entity.LessonContentType;
import com.example.academic_management_api.course.lesson.entity.LessonProgress;
import com.example.academic_management_api.course.lesson.entity.Lessons;
import com.example.academic_management_api.course.lesson.repository.LessonProgressRepository;
import com.example.academic_management_api.course.lesson.repository.LessonRepository;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.service.EnrollmentService;
import com.example.academic_management_api.user.entity.Role;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
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
    @Mock
    private LessonProgressRepository lessonProgressRepository;
    @Mock
    private EnrollmentService enrollmentService;

    private LessonService lessonService;

    @BeforeEach
    void setUp() {
        lessonService = new LessonService(lessonRepository, courseRepository, userRepository, lessonProgressRepository, enrollmentService);
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

    // ---- Phase 35: Lesson Player (Student) ----

    private Lessons lesson(int id, Courses course, boolean isPreview) {
        Lessons l = new Lessons();
        l.setLessonId(id);
        l.setCourse(course);
        l.setPreview(isPreview);
        l.setOrderIndex(id);
        l.setContentType(LessonContentType.DOCUMENT);
        return l;
    }

    @Test
    void getLessonsForStudent_notEnrolled_onlyReturnsPreviewLessons() {
        Users student = user(10, "student1");
        Courses course = course(1, user(1, "teacherA"));
        course.setTitle("Java Basics");
        Lessons preview = lesson(100, course, true);
        Lessons locked = lesson(101, course, false);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);
        when(lessonRepository.findByCourse_CourseIdOrderByOrderIndexAsc(1)).thenReturn(List.of(preview, locked));
        when(lessonProgressRepository.findByStudent_UserIdAndLesson_Course_CourseId(10, 1)).thenReturn(List.of());

        StudentCourseLessonsDto result = lessonService.getLessonsForStudent(1, "student1");

        assertThat(result.getLessons()).hasSize(1);
        assertThat(result.getLessons().get(0).getLessonId()).isEqualTo(100);
        assertThat(result.getProgressPercent()).isZero();
        assertThat(result.isEnrolled()).isFalse();
    }

    @Test
    void getLessonsForStudent_enrolled_returnsAllLessonsWithProgressPercent() {
        Users student = user(10, "student1");
        Courses course = course(1, user(1, "teacherA"));
        course.setTitle("Java Basics");
        Lessons lesson1 = lesson(100, course, false);
        Lessons lesson2 = lesson(101, course, false);

        LessonProgress progress = new LessonProgress();
        progress.setLesson(lesson1);
        progress.setCompleted(true);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(courseRepository.findById(1)).thenReturn(Optional.of(course));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(true);
        when(lessonRepository.findByCourse_CourseIdOrderByOrderIndexAsc(1)).thenReturn(List.of(lesson1, lesson2));
        when(lessonProgressRepository.findByStudent_UserIdAndLesson_Course_CourseId(10, 1)).thenReturn(List.of(progress));

        StudentCourseLessonsDto result = lessonService.getLessonsForStudent(1, "student1");

        assertThat(result.getLessons()).hasSize(2);
        assertThat(result.getProgressPercent()).isEqualTo(50);
        assertThat(result.isEnrolled()).isTrue();
    }

    @Test
    void markLessonComplete_notEnrolled_throwsForbidden_evenIfLessonIsPreview() {
        Users student = user(10, "student1");
        Courses course = course(1, user(1, "teacherA"));
        Lessons preview = lesson(100, course, true);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(lessonRepository.findByIdWithCourse(100)).thenReturn(Optional.of(preview));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(false);

        assertThatThrownBy(() -> lessonService.markLessonComplete(100, "student1"))
                .isInstanceOf(ForbiddenException.class);

        verify(lessonProgressRepository, never()).save(any());
    }

    @Test
    void markLessonComplete_enrolled_createsNewProgressWhenNoneExists() {
        Users student = user(10, "student1");
        Courses course = course(1, user(1, "teacherA"));
        Lessons lesson = lesson(100, course, false);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(lessonRepository.findByIdWithCourse(100)).thenReturn(Optional.of(lesson));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(true);
        when(lessonProgressRepository.findByStudent_UserIdAndLesson_LessonId(10, 100)).thenReturn(Optional.empty());
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentLessonDto result = lessonService.markLessonComplete(100, "student1");

        assertThat(result.isCompleted()).isTrue();
        verify(lessonProgressRepository).save(argThat(p ->
                p.getStudent() == student && p.getLesson() == lesson && Boolean.TRUE.equals(p.getCompleted())
        ));
    }

    @Test
    void markLessonComplete_enrolled_updatesExistingProgress_doesNotCreateDuplicate() {
        Users student = user(10, "student1");
        Courses course = course(1, user(1, "teacherA"));
        Lessons lesson = lesson(100, course, false);
        LessonProgress existing = new LessonProgress();
        existing.setStudent(student);
        existing.setLesson(lesson);
        existing.setCompleted(false);

        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));
        when(lessonRepository.findByIdWithCourse(100)).thenReturn(Optional.of(lesson));
        when(enrollmentService.isEnrolled(10, 1)).thenReturn(true);
        when(lessonProgressRepository.findByStudent_UserIdAndLesson_LessonId(10, 100)).thenReturn(Optional.of(existing));
        when(lessonProgressRepository.save(any(LessonProgress.class))).thenAnswer(inv -> inv.getArgument(0));

        lessonService.markLessonComplete(100, "student1");

        verify(lessonProgressRepository).save(existing);
        assertThat(existing.getCompleted()).isTrue();
        assertThat(existing.getCompletedAt()).isNotNull();
    }

    @Test
    void getCompletionPercentByStudentIds_courseHasNoLessons_returnsZeroForEveryStudent() {
        when(lessonRepository.countByCourse_CourseId(1)).thenReturn(0L);

        Map<Integer, Integer> result = lessonService.getCompletionPercentByStudentIds(1, List.of(10, 20));

        assertThat(result).containsEntry(10, 0).containsEntry(20, 0);
        verify(lessonProgressRepository, never()).countCompletedGroupedByStudentForCourse(anyInt());
    }

    @Test
    void getAverageCompletionPercent_excludesCoursesWithNoLessonsFromAverage() {
        when(lessonRepository.countGroupedByCourseIds(List.of(1, 2)))
                .thenReturn(List.of(new CourseLessonCountDto(1, 4)));
        when(lessonProgressRepository.countCompletedGroupedByCourseForStudent(10, List.of(1, 2)))
                .thenReturn(List.of(new CourseLessonCountDto(1, 2)));

        Integer result = lessonService.getAverageCompletionPercent(10, List.of(1, 2));

        assertThat(result).isEqualTo(50);
        // Batch — không có N query rải rác theo từng course.
        verify(lessonRepository, never()).countByCourse_CourseId(anyInt());
        verify(lessonProgressRepository, never())
                .countByStudent_UserIdAndLesson_Course_CourseIdAndCompletedTrue(anyInt(), anyInt());
    }

    @Test
    void getAverageCompletionPercent_noCourseHasLessons_returnsNull() {
        when(lessonRepository.countGroupedByCourseIds(List.of(1))).thenReturn(List.of());

        Integer result = lessonService.getAverageCompletionPercent(10, List.of(1));

        assertThat(result).isNull();
    }

    @Test
    void getAverageCompletionPercent_noCourseIds_returnsNullWithoutQuerying() {
        Integer result = lessonService.getAverageCompletionPercent(10, List.of());

        assertThat(result).isNull();
        verifyNoInteractions(lessonRepository, lessonProgressRepository);
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
