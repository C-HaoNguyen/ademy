package com.example.academic_management_api.enrollment.repository;

import com.example.academic_management_api.enrollment.entity.Enrollments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollments, Integer> {
    boolean existsByStudent_UserIdAndCourse_CourseId(
            Integer studentId,
            Integer courseId
    );

    List<Enrollments> findByStudent_UserId(Integer studentId);

    @Query("""
        SELECT e FROM Enrollments e
        JOIN FETCH e.course c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        WHERE e.student.userId = :studentId
        """)
    List<Enrollments> findByStudent_UserIdWithCourse(@Param("studentId") Integer studentId);

    long countByStudent_UserId(Integer studentId);

    @Query("""
        SELECT e FROM Enrollments e
        JOIN FETCH e.student
        WHERE e.course.courseId = :courseId
        """)
    List<Enrollments> findByCourse_CourseIdWithStudent(@Param("courseId") Integer courseId);
}
