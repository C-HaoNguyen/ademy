package com.example.academic_management_api.enrollment.service;

import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.dto.MyCourseDto;
import com.example.academic_management_api.enrollment.entity.Enrollments;
import com.example.academic_management_api.enrollment.repository.EnrollmentRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CourseRepository courseRepository;

    private EnrollmentService enrollmentService;

    @BeforeEach
    void setUp() {
        enrollmentService = new EnrollmentService(enrollmentRepository, userRepository, courseRepository);
    }

    @Test
    void isEnrolled_excludesRevokedEnrollments_soStudentCanRepurchaseAfterRevoke() {
        when(enrollmentRepository.existsByStudent_UserIdAndCourse_CourseIdAndAccessRevokedAtIsNull(10, 1))
                .thenReturn(false);

        boolean result = enrollmentService.isEnrolled(10, 1);

        assertThat(result).isFalse();
        verify(enrollmentRepository).existsByStudent_UserIdAndCourse_CourseIdAndAccessRevokedAtIsNull(10, 1);
        verify(enrollmentRepository, never()).existsByStudent_UserIdAndCourse_CourseId(anyInt(), anyInt());
    }

    @Test
    void isEnrolled_stillTrueForActiveEnrollment() {
        when(enrollmentRepository.existsByStudent_UserIdAndCourse_CourseIdAndAccessRevokedAtIsNull(10, 1))
                .thenReturn(true);

        boolean result = enrollmentService.isEnrolled(10, 1);

        assertThat(result).isTrue();
    }

    @Test
    void getMyCourses_returnsDtoWithInstructorNameAndEnrolledAt() {
        Users student = new Users();
        student.setUserId(10);
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));

        Users instructor = new Users();
        instructor.setFullName("Nguyen Van A");

        Courses course = new Courses();
        course.setCourseId(1);
        course.setTitle("Java Basics");
        course.setThumbnail("thumb.png");
        course.setInstructor(instructor);

        LocalDateTime enrolledAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        Enrollments enrollment = new Enrollments();
        enrollment.setCourse(course);
        enrollment.setEnrolledAt(enrolledAt);

        when(enrollmentRepository.findByStudent_UserIdWithCourse(10)).thenReturn(List.of(enrollment));

        List<MyCourseDto> result = enrollmentService.getMyCourses("student1");

        assertThat(result).hasSize(1);
        MyCourseDto dto = result.get(0);
        assertThat(dto.getCourseId()).isEqualTo(1);
        assertThat(dto.getTitle()).isEqualTo("Java Basics");
        assertThat(dto.getThumbnail()).isEqualTo("thumb.png");
        assertThat(dto.getInstructorName()).isEqualTo("Nguyen Van A");
        assertThat(dto.getEnrolledAt()).isEqualTo(enrolledAt);
    }
}
