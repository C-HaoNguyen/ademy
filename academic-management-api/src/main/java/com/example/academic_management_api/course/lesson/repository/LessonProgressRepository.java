package com.example.academic_management_api.course.lesson.repository;

import com.example.academic_management_api.course.lesson.dto.CourseLessonCountDto;
import com.example.academic_management_api.course.lesson.dto.StudentLessonCompletionCountDto;
import com.example.academic_management_api.course.lesson.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Integer> {

    Optional<LessonProgress> findByStudent_UserIdAndLesson_LessonId(Integer studentId, Integer lessonId);

    List<LessonProgress> findByStudent_UserIdAndLesson_Course_CourseId(Integer studentId, Integer courseId);

    long countByStudent_UserIdAndLesson_Course_CourseIdAndCompletedTrue(Integer studentId, Integer courseId);

    // Phase 35 — Teacher "Học viên" tab (progressPercent theo từng student trong 1 course).
    @Query("""
        SELECT new com.example.academic_management_api.course.lesson.dto.StudentLessonCompletionCountDto(
            lp.student.userId, COUNT(lp)
        )
        FROM LessonProgress lp
        WHERE lp.lesson.course.courseId = :courseId AND lp.completed = true
        GROUP BY lp.student.userId
        """)
    List<StudentLessonCompletionCountDto> countCompletedGroupedByStudentForCourse(@Param("courseId") Integer courseId);

    // Phase 35 — batch cho getAverageCompletionPercent (Dashboard): 1 query cho N course của 1
    // student thay vì N query countByStudent_UserIdAndLesson_Course_CourseIdAndCompletedTrue riêng lẻ.
    @Query("""
        SELECT new com.example.academic_management_api.course.lesson.dto.CourseLessonCountDto(
            lp.lesson.course.courseId, COUNT(lp)
        )
        FROM LessonProgress lp
        WHERE lp.student.userId = :studentId AND lp.lesson.course.courseId IN :courseIds AND lp.completed = true
        GROUP BY lp.lesson.course.courseId
        """)
    List<CourseLessonCountDto> countCompletedGroupedByCourseForStudent(
            @Param("studentId") Integer studentId,
            @Param("courseIds") Collection<Integer> courseIds
    );
}
