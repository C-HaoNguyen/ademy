package com.example.academic_management_api.course.service;

import com.example.academic_management_api.category.entity.Categories;
import com.example.academic_management_api.category.repository.CategoryRepository;
import com.example.academic_management_api.common.exception.NotFoundException;
import com.example.academic_management_api.course.dto.CourseResponseDto;
import com.example.academic_management_api.course.dto.CreateCourseRequest;
import com.example.academic_management_api.course.entity.Courses;
import com.example.academic_management_api.course.repository.CourseRepository;
import com.example.academic_management_api.user.entity.Users;
import com.example.academic_management_api.user.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public CourseService(CourseRepository courseRepository, UserRepository userRepository, CategoryRepository categoryRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    private CourseResponseDto mapToDto(Courses course) {
        return new CourseResponseDto(
                course.getCourseId(),
                course.getTitle(),
                course.getDescription(),
                course.getPrice(),
                course.getCreatedAt(),
                course.getThumbnail(),

                // instructor
                course.getInstructor().getUsername(),
                course.getInstructor().getFullName(),

                // category
                course.getCategory().getCategoryId(),
                course.getCategory().getCategoryName()
        );
    }

    public List<CourseResponseDto> getAllCoursesDto() {
        List<Courses> courses = courseRepository.findAll();
        List<CourseResponseDto> response = new ArrayList<>();

        for (Courses course : courses) {
            response.add(mapToDto(course));
        }

        return response;
    }

    public CourseResponseDto getCourseDetail(Integer id) {
        Courses course = courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Course not found"));

        return mapToDto(course);
    }

    public Courses getClassDetail(Integer classId) {
        return courseRepository.findById(classId).orElse(null);
    }

    // ---- Admin operations ----

    public List<Courses> getAllCourses() {
        List<Courses> allCourses = courseRepository.findAll();
        return allCourses;
    }

    public long getTotalCourses() {
        return courseRepository.count();
    }

    public ResponseEntity<?> createCourse(CreateCourseRequest request) {
        Users instructor = userRepository.findById(request.getInstructorId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giảng viên"));

        Categories category = null;

        if (request.getCategoryId() == null) {
            return ResponseEntity.badRequest()
                    .body("Danh mục không được để trống");
        }

        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));
        }

        Courses course = new Courses();

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(instructor);
        course.setCategory(category);
        course.setThumbnail(request.getThumbnail());
        course.setPrice(request.getPrice());
        course.setLevel(request.getLevel());
        course.setStatus(
                request.getStatus() != null ? request.getStatus() : "draft"
        );

        Courses savedCourse = courseRepository.save(course);

        return ResponseEntity.ok(savedCourse);
    }

    public ResponseEntity<?> updateCourse(Integer id, CreateCourseRequest request) {
        Courses course = courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khóa học"));

        Users instructor = userRepository.findById(request.getInstructorId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy giảng viên"));

        if (request.getCategoryId() == null) {
            return ResponseEntity.badRequest()
                    .body("Danh mục không được để trống");
        }

        Categories category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy danh mục"));

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setInstructor(instructor);
        course.setCategory(category);
        course.setThumbnail(request.getThumbnail());
        course.setPrice(request.getPrice());
        course.setLevel(request.getLevel());
        course.setStatus(
                request.getStatus() != null ? request.getStatus() : course.getStatus()
        );

        Courses saved = courseRepository.save(course);

        return ResponseEntity.ok(saved);
    }

    public void deleteCourse(Integer courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new NotFoundException("Không tìm thấy khóa học");
        }
        courseRepository.deleteById(courseId);
    }
}
