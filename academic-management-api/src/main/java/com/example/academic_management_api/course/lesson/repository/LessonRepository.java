package com.example.academic_management_api.course.lesson.repository;

import com.example.academic_management_api.course.lesson.dto.CourseLessonCountDto;
import com.example.academic_management_api.course.lesson.entity.Lessons;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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

    boolean existsByCourse_CourseId(Integer courseId);

    long countByCourse_CourseId(Integer courseId);

    // Phase 35 — batch cho getAverageCompletionPercent (Dashboard): 1 query cho N course thay vì
    // N query countByCourse_CourseId riêng lẻ.
    @Query("""
        SELECT new com.example.academic_management_api.course.lesson.dto.CourseLessonCountDto(
            l.course.courseId, COUNT(l)
        )
        FROM Lessons l
        WHERE l.course.courseId IN :courseIds
        GROUP BY l.course.courseId
        """)
    List<CourseLessonCountDto> countGroupedByCourseIds(@Param("courseIds") Collection<Integer> courseIds);
}
