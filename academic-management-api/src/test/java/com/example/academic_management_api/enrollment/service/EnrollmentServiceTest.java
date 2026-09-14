package com.example.academic_management_api.enrollment.service;

import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.lesson.service.LessonService;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.enrollment.dto.EnrolledStudentDto;
import com.example.academic_management_api.enrollment.dto.MyCourseDto;
import com.example.academic_management_api.enrollment.dto.TeacherCourseStudentCountDto;
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
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private LessonService lessonService;

    private EnrollmentService enrollmentService;

    @BeforeEach
    void setUp() {
        enrollmentService = new EnrollmentService(enrollmentRepository, userRepository, courseRepository, lessonService);
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

    @Test
    void getStudentCountsByTeacher_delegatesToRepositoryGroupedQuery() {
        List<TeacherCourseStudentCountDto> counts = List.of(
                new TeacherCourseStudentCountDto(1, 3L),
                new TeacherCourseStudentCountDto(2, 1L)
        );
        when(enrollmentRepository.countActiveStudentsGroupedByCourseForTeacher("teacher1")).thenReturn(counts);

        List<TeacherCourseStudentCountDto> result = enrollmentService.getStudentCountsByTeacher("teacher1");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getCourseId()).isEqualTo(1);
        assertThat(result.get(0).getStudentCount()).isEqualTo(3L);
        verify(enrollmentRepository).countActiveStudentsGroupedByCourseForTeacher("teacher1");
    }

    @Test
    void getStudentsByCourseAsAdmin_returnsStudentsWithoutOwnershipCheck() {
        when(courseRepository.existsById(1)).thenReturn(true);

        Users student = new Users();
        student.setUsername("student1");
        student.setFullName("Nguyễn Văn B");

        Enrollments enrollment = new Enrollments();
        enrollment.setEnrollmentId(100);
        enrollment.setStudent(student);
        LocalDateTime enrolledAt = LocalDateTime.of(2026, 1, 1, 0, 0);
        enrollment.setEnrolledAt(enrolledAt);

        when(enrollmentRepository.findByCourse_CourseIdWithStudent(1)).thenReturn(List.of(enrollment));
        when(lessonService.getCompletionPercentByStudentIds(eq(1), anyList())).thenReturn(Map.of(20, 75));
        student.setUserId(20);

        List<EnrolledStudentDto> result = enrollmentService.getStudentsByCourseAsAdmin(1);

        assertThat(result).hasSize(1);
        EnrolledStudentDto dto = result.get(0);
        assertThat(dto.getEnrollmentId()).isEqualTo(100);
        assertThat(dto.getStudentUsername()).isEqualTo("student1");
        assertThat(dto.getStudentFullName()).isEqualTo("Nguyễn Văn B");
        assertThat(dto.getEnrolledAt()).isEqualTo(enrolledAt);
        assertThat(dto.getAccessRevokedAt()).isNull();
        assertThat(dto.getProgressPercent()).isEqualTo(75);
        verify(courseRepository, never()).findById(anyInt());
    }

    @Test
    void getStudentsByCourseAsAdmin_courseNotFound_throwsNotFound() {
        when(courseRepository.existsById(99)).thenReturn(false);

        assertThatThrownBy(() -> enrollmentService.getStudentsByCourseAsAdmin(99))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void getAverageProgressPercent_delegatesToLessonServiceWithOwnCourseIds() {
        Users student = new Users();
        student.setUserId(10);
        when(userRepository.findByUsername("student1")).thenReturn(Optional.of(student));

        Courses course1 = new Courses();
        course1.setCourseId(1);
        Courses course2 = new Courses();
        course2.setCourseId(2);

        Enrollments e1 = new Enrollments();
        e1.setCourse(course1);
        Enrollments e2 = new Enrollments();
        e2.setCourse(course2);
        when(enrollmentRepository.findByStudent_UserId(10)).thenReturn(List.of(e1, e2));

        when(lessonService.getAverageCompletionPercent(10, List.of(1, 2))).thenReturn(50);

        Integer result = enrollmentService.getAverageProgressPercent("student1");

        assertThat(result).isEqualTo(50);
    }
}
