package com.example.academic_management_api.course.service;

import com.example.academic_management_api.category.entity.Categories;
import com.example.academic_management_api.category.repository.CategoryRepository;
import com.example.academic_management_api.common.exception.ConflictException;
import com.example.academic_management_api.course.dto.RecentlyPublishedCourseDto;
import com.example.academic_management_api.course.dto.TeacherCourseRequest;
import com.example.academic_management_api.course.entity.CourseStatus;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.service.LessonService;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

// Phase 29 — AdminDashboard "Khóa học mới publish gần đây". Chỉ test method mới thêm ở phase này,
// không mở rộng coverage cho phần còn lại của CourseService (ngoài scope Phase 29).
// Phase 30 — thêm test cho validate publish thất bại khi curriculum rỗng (UI_SPEC §4.3).
@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private LessonService lessonService;

    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseService = new CourseService(courseRepository, userRepository, categoryRepository, lessonService);
    }

    private Courses publishedCourse() {
        Users instructor = new Users();
        instructor.setUserId(5);
        instructor.setFullName("Nguyễn Văn A");

        Courses course = new Courses();
        course.setCourseId(1);
        course.setTitle("Java cơ bản");
        course.setThumbnail("thumb.png");
        course.setInstructor(instructor);
        course.setUpdatedAt(LocalDateTime.of(2026, 9, 1, 10, 0));
        return course;
    }

    @Test
    void getRecentlyPublished_mapsInstructorNameAndUpdatedAtWithoutLeakingEntity() {
        when(courseRepository.findPublishedOrderByUpdatedAtDesc(any(Pageable.class)))
                .thenReturn(List.of(publishedCourse()));

        List<RecentlyPublishedCourseDto> result = courseService.getRecentlyPublished(5);

        assertThat(result).hasSize(1);
        RecentlyPublishedCourseDto dto = result.get(0);
        assertThat(dto.getCourseId()).isEqualTo(1);
        assertThat(dto.getTitle()).isEqualTo("Java cơ bản");
        assertThat(dto.getInstructorName()).isEqualTo("Nguyễn Văn A");
        assertThat(dto.getUpdatedAt()).isEqualTo(LocalDateTime.of(2026, 9, 1, 10, 0));
    }

    @Test
    void getRecentlyPublished_none_returnsEmptyList() {
        when(courseRepository.findPublishedOrderByUpdatedAtDesc(any(Pageable.class)))
                .thenReturn(List.of());

        List<RecentlyPublishedCourseDto> result = courseService.getRecentlyPublished(5);

        assertThat(result).isEmpty();
    }

    // TeacherCourseRequest chỉ có getter (bind qua Jackson từ JSON) — set field bằng reflection,
    // cùng pattern đã dùng ở LessonServiceTest.setField().
    private void setField(Object target, String fieldName, Object value) {
        try {
            var field = target.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    private TeacherCourseRequest requestWithStatus(CourseStatus status, Integer categoryId) {
        TeacherCourseRequest request = new TeacherCourseRequest();
        setField(request, "title", "Khóa học test");
        setField(request, "categoryId", categoryId);
        setField(request, "price", BigDecimal.TEN);
        setField(request, "status", status);
        return request;
    }

    @Test
    void createOwnCourse_withStatusPublished_throwsConflictBecauseNewCourseCannotHaveLessons() {
        Users teacher = new Users();
        teacher.setUserId(9);
        when(userRepository.findByUsername("teacher1")).thenReturn(Optional.of(teacher));

        TeacherCourseRequest request = requestWithStatus(CourseStatus.PUBLISHED, 1);

        assertThatThrownBy(() -> courseService.createOwnCourse(request, "teacher1"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateOwnCourse_publishWithoutAnyLesson_throwsConflict() {
        Users teacher = new Users();
        teacher.setUserId(9);
        when(userRepository.findByUsername("teacher1")).thenReturn(Optional.of(teacher));

        Courses course = new Courses();
        course.setCourseId(10);
        course.setInstructor(teacher);
        when(courseRepository.findByIdWithDetails(10)).thenReturn(Optional.of(course));
        when(lessonService.hasAnyLesson(10)).thenReturn(false);

        TeacherCourseRequest request = requestWithStatus(CourseStatus.PUBLISHED, 1);

        assertThatThrownBy(() -> courseService.updateOwnCourse(10, request, "teacher1"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateOwnCourse_publishWithAtLeastOneLesson_succeeds() {
        Users teacher = new Users();
        teacher.setUserId(9);
        when(userRepository.findByUsername("teacher1")).thenReturn(Optional.of(teacher));

        Courses course = new Courses();
        course.setCourseId(10);
        course.setInstructor(teacher);
        when(courseRepository.findByIdWithDetails(10)).thenReturn(Optional.of(course));
        when(lessonService.hasAnyLesson(10)).thenReturn(true);

        Categories category = new Categories();
        setField(category, "categoryId", 1);
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(courseRepository.save(any(Courses.class))).thenAnswer(inv -> inv.getArgument(0));

        TeacherCourseRequest request = requestWithStatus(CourseStatus.PUBLISHED, 1);

        ResponseEntity<?> response = courseService.updateOwnCourse(10, request, "teacher1");

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    void updateOwnCourse_keepDraft_doesNotCheckLessons() {
        Users teacher = new Users();
        teacher.setUserId(9);
        when(userRepository.findByUsername("teacher1")).thenReturn(Optional.of(teacher));

        Courses course = new Courses();
        course.setCourseId(10);
        course.setInstructor(teacher);
        when(courseRepository.findByIdWithDetails(10)).thenReturn(Optional.of(course));

        Categories category = new Categories();
        setField(category, "categoryId", 1);
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(courseRepository.save(any(Courses.class))).thenAnswer(inv -> inv.getArgument(0));

        TeacherCourseRequest request = requestWithStatus(CourseStatus.DRAFT, 1);

        ResponseEntity<?> response = courseService.updateOwnCourse(10, request, "teacher1");

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }
}
