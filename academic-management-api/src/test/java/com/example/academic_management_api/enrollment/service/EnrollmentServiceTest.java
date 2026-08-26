package com.example.academic_management_api.enrollment.service;

import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.repository.EnrollmentRepository;
import com.example.academic_management_api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
}
