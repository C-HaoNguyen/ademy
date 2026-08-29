package com.example.academic_management_api.course.lesson.repository;

import com.example.academic_management_api.course.lesson.entity.Lessons;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lessons, Integer> {

    @Query("""
        SELECT l FROM Lessons l
        JOIN FETCH l.course
        WHERE l.course.courseId = :courseId
        ORDER BY l.orderIndex ASC
        """)
    List<Lessons> findByCourse_CourseIdOrderByOrderIndexAsc(@Param("courseId") Integer courseId);

    @Query("""
        SELECT l FROM Lessons l
        JOIN FETCH l.course
        WHERE l.lessonId = :lessonId
        """)
    Optional<Lessons> findByIdWithCourse(@Param("lessonId") Integer lessonId);
}
