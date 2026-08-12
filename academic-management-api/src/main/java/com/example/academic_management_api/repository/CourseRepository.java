package com.example.academic_management_api.repository;

import com.example.academic_management_api.entity.Courses;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CourseRepository extends JpaRepository<Courses, Integer> {

    @Query(
            value = """
        SELECT 
            c.course_id,
            c.title,
            c.description,
            c.price,
            c.thumbnail,
            u.username,
            u.full_name,
            cat.category_id,
            cat.category_name
        FROM courses c
        JOIN users u 
            ON c.instructor_username = u.username
        JOIN categories cat 
            ON c.category_id = cat.category_id
        ORDER BY c.created_at DESC
        """,
        nativeQuery = true
    )
    List<Object[]> findAllCoursesDetail();
}
