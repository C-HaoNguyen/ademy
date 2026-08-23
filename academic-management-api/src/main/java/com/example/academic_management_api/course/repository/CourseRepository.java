package com.example.academic_management_api.course.repository;

import com.example.academic_management_api.course.entity.Courses;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Courses, Integer> {

    @Query("""
        SELECT c FROM Courses c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        """)
    List<Courses> findAllWithDetails();

    @Query("""
        SELECT c FROM Courses c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        WHERE c.status = com.example.academic_management_api.course.entity.CourseStatus.PUBLISHED
        """)
    List<Courses> findAllPublishedWithDetails();

    @Query("""
        SELECT c FROM Courses c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        WHERE c.instructor.userId = :instructorId
        """)
    List<Courses> findByInstructor_UserId(@Param("instructorId") Integer instructorId);

    @Query("""
        SELECT c FROM Courses c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        WHERE c.courseId = :courseId
        """)
    Optional<Courses> findByIdWithDetails(@Param("courseId") Integer courseId);
}
