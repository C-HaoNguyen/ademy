package com.example.academic_management_api.course.repository;

import com.example.academic_management_api.course.entity.Courses;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CourseRepository extends JpaRepository<Courses, Integer> {

    @Query("""
        SELECT c FROM Courses c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        """)
    List<Courses> findAllWithDetails();
}
