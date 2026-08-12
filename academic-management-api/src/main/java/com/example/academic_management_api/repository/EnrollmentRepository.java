package com.example.academic_management_api.repository;

import com.example.academic_management_api.entity.Enrollments;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollments, Integer> {
    boolean existsByStudent_UserIdAndCourse_CourseId(
            Integer studentId,
            Integer courseId
    );

    List<Enrollments> findByStudent_UserId(Integer studentId);

    long countByStudent_UserId(Integer studentId);
}
