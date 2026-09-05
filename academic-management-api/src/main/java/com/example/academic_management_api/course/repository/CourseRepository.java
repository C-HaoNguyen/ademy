package com.example.academic_management_api.course.repository;

import com.example.academic_management_api.course.entity.Courses;
import org.springframework.data.domain.Pageable;
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

    // Phase 29 — AdminDashboard "Khóa học mới publish gần đây". Không có publishedAt riêng
    // (Courses chỉ có createdAt/updatedAt) và chưa có action "publish" tách biệt (status set trực
    // tiếp lúc create/update, Teacher publish flow thật là Phase 30) — dùng updatedAt của course
    // đang PUBLISHED làm proxy. Biết trước hạn chế: sửa course đã publish (đổi title/giá...) cũng
    // đẩy nó lên đầu danh sách này, không chỉ riêng lúc publish thật. Chấp nhận được vì đây chỉ là
    // preview rút gọn trên Dashboard, không phải nguồn số liệu chính thức — điểm sửa đúng là thêm
    // published_at, set khi Teacher publish thật (Phase 30).
    @Query("""
        SELECT c FROM Courses c
        JOIN FETCH c.instructor
        LEFT JOIN FETCH c.category
        WHERE c.status = com.example.academic_management_api.course.entity.CourseStatus.PUBLISHED
        ORDER BY c.updatedAt DESC
        """)
    List<Courses> findPublishedOrderByUpdatedAtDesc(Pageable pageable);
}
