package com.example.academic_management_api.course.dto;

import com.example.academic_management_api.course.entity.CourseStatus;

import java.time.LocalDateTime;

// Phase 31 — GET /admin/courses. DTO phẳng thay vì trả raw Courses (tránh leak lazy proxy, cùng lý
// do RecentlyPublishedCourseDto/MyCourseDto) — đủ field cho bảng giám sát theo UI_SPEC §5.3 (Tên
// khóa học, Teacher sở hữu, Trạng thái, Số học viên, Ngày publish); không còn field CRUD cũ
// (thumbnail/price/level) vì Admin không còn tự sửa course. Giữ lại categoryId (không hiển thị ở
// bảng AdminCourses) vì AdminCategories.tsx (ngoài scope Phase 31) đang dùng field này từ cùng
// endpoint để đếm "Số khóa học" theo danh mục — bỏ hẳn sẽ phá vỡ trang đó ngoài ý muốn.
public class AdminCourseListDto {
    private final Integer courseId;
    private final String title;
    private final CourseStatus status;
    private final String instructorFullName;
    private final long studentCount;
    private final LocalDateTime publishedAt;
    private final Integer categoryId;

    public AdminCourseListDto(
            Integer courseId,
            String title,
            CourseStatus status,
            String instructorFullName,
            long studentCount,
            LocalDateTime publishedAt,
            Integer categoryId
    ) {
        this.courseId = courseId;
        this.title = title;
        this.status = status;
        this.instructorFullName = instructorFullName;
        this.studentCount = studentCount;
        this.publishedAt = publishedAt;
        this.categoryId = categoryId;
    }

    public Integer getCourseId() {
        return courseId;
    }

    public String getTitle() {
        return title;
    }

    public CourseStatus getStatus() {
        return status;
    }

    public String getInstructorFullName() {
        return instructorFullName;
    }

    public long getStudentCount() {
        return studentCount;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public Integer getCategoryId() {
        return categoryId;
    }
}
