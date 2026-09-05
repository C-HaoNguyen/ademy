package com.example.academic_management_api.course.service;

import com.example.academic_management_api.category.repository.CategoryRepository;
import com.example.academic_management_api.course.dto.RecentlyPublishedCourseDto;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

// Phase 29 — AdminDashboard "Khóa học mới publish gần đây". Chỉ test method mới thêm ở phase này,
// không mở rộng coverage cho phần còn lại của CourseService (ngoài scope Phase 29).
@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;

    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseService = new CourseService(courseRepository, userRepository, categoryRepository);
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
}
